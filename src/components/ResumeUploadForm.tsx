import { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUploadDropzone } from './FileUploadDropzone';
import { ScreeningResult } from './ScreeningResult';
import { 
  resumeFormSchema, 
  ResumeFormData, 
  getErrorMessage 
} from '@/lib/validations';
import { 
  parseN8nResponse, 
  ScreeningResult as ScreeningResultType,
  shouldSendInterviewInvitation,
  shouldSendRejectionEmail
} from '@/lib/n8nResponseMapper';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const N8N_WEBHOOK_URL = 'https://suhaibbb.app.n8n.cloud/webhook/screen-resume';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function ResumeUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [screeningResult, setScreeningResult] = useState<ScreeningResultType | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const emailSentRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    getValues,
  } = useForm<ResumeFormData>({
    resolver: zodResolver(resumeFormSchema),
    mode: 'onChange',
  });

  const isFormValid = isValid && file !== null;
  const isSubmitting = submitState === 'submitting';

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setFileError(selectedFile === null ? null : null);
    // Reset result when file changes
    if (screeningResult) {
      setScreeningResult(null);
      setSubmitState('idle');
      setEmailSent(false);
      emailSentRef.current = false;
    }
  }, [screeningResult]);

  const sendCandidateEmail = async (
    candidateName: string,
    candidateEmail: string,
    result: ScreeningResultType
  ) => {
    // Prevent duplicate email sends
    if (emailSentRef.current) {
      console.log('Email already sent, skipping...');
      return;
    }
    emailSentRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('send-candidate-email', {
        body: {
          candidateName,
          candidateEmail,
          result: {
            overall_score: result.overall_score,
            verdict: result.verdict,
            normalizedVerdict: result.normalizedVerdict,
            short_reason: result.short_reason,
            recommended_next_steps: result.recommended_next_steps,
          },
        },
      });

      if (error) {
        console.error('Failed to send email:', error);
        toast.error('Failed to send candidate notification email');
        emailSentRef.current = false;
        return;
      }

      console.log('Email sent successfully:', data);
      setEmailSent(true);
      
      if (shouldSendInterviewInvitation(result)) {
        toast.success('Interview invitation email sent to candidate');
      } else if (shouldSendRejectionEmail(result)) {
        toast.info('Application status email sent to candidate');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      emailSentRef.current = false;
    }
  };

  const onSubmit = async (data: ResumeFormData) => {
    if (!file) {
      setFileError('Please upload your resume');
      return;
    }

    setSubmitState('submitting');
    setErrorMessage(null);
    setScreeningResult(null);
    setEmailSent(false);
    emailSentRef.current = false;

    try {
      // Build FormData with exact field names n8n expects
      const formData = new FormData();
      formData.append('Resume_PDF_only_', file);
      formData.append('Email Address', data.email);
      formData.append('Full Name', data.fullName);
      formData.append('job_description', data.jobDescription);

      console.log('Submitting to n8n webhook:', N8N_WEBHOOK_URL);
      console.log('Form data fields:', {
        'Resume_PDF_only_': file.name,
        'Email Address': data.email,
        'Full Name': data.fullName,
        'job_description': data.jobDescription.substring(0, 100) + '...',
      });

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Handle specific error codes
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      
      if (response.status === 402) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errMsg = `Server responded with status ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) errMsg = errorData.error;
          if (errorData.message) errMsg = errorData.message;
        } catch {
          if (errorText && errorText.length < 200) errMsg = errorText;
        }
        throw new Error(errMsg);
      }

      // Get response as text first to handle empty or malformed responses
      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      if (!responseText || responseText.trim() === '') {
        throw new Error('The screening service returned an empty response. The n8n workflow may still be processing. Please wait a moment and try again.');
      }

      let responseData: unknown;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error(`Invalid JSON response from screening service: ${responseText.substring(0, 100)}`);
      }

      console.log('Parsed response:', responseData);

      // Check for error in response body
      if (typeof responseData === 'object' && responseData !== null && 'error' in responseData) {
        throw new Error((responseData as { error: string }).error);
      }

      // Parse and validate using centralized mapper
      const parseResult = parseN8nResponse(responseData);
      
      if (!parseResult.success) {
        throw new Error((parseResult as { success: false; error: string }).error);
      }

      const result = (parseResult as { success: true; data: ScreeningResultType }).data;
      setScreeningResult(result);
      setSubmitState('success');

      // Save candidate to database
      try {
        const { error: insertError } = await supabase
          .from('candidates')
          .insert({
            name: data.fullName,
            email: data.email,
            role: data.jobDescription.split('\n')[0].substring(0, 100) || 'General Application',
            score: result.overall_score,
            verdict: result.normalizedVerdict.toLowerCase(),
            confidence: result.confidence,
            summary: result.summary,
            matched_skills: result.matched_skills,
            years_relevant_experience: result.years_relevant_experience,
            short_reason: result.short_reason,
            recommended_next_steps: result.recommended_next_steps,
            email_draft: result.email_draft,
          });

        if (insertError) {
          console.error('Failed to save candidate to database:', insertError);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }

      // Send email based on verdict (async, non-blocking)
      if (shouldSendInterviewInvitation(result) || shouldSendRejectionEmail(result)) {
        sendCandidateEmail(data.fullName, data.email, result);
      }

    } catch (error) {
      console.error('Submission error:', error);
      const errMsg = error instanceof Error ? error.message : getErrorMessage(error);
      setErrorMessage(errMsg);
      setSubmitState('error');
    }
  };

  const handleReset = () => {
    reset();
    setFile(null);
    setFileError(null);
    setSubmitState('idle');
    setErrorMessage(null);
    setScreeningResult(null);
    setEmailSent(false);
    emailSentRef.current = false;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              disabled={isSubmitting}
              className={cn(errors.fullName && "border-destructive focus-visible:ring-destructive")}
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              disabled={isSubmitting}
              className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-2">
          <Label htmlFor="jobDescription" className="text-sm font-medium">
            Job Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="jobDescription"
            placeholder="Paste the job description here..."
            rows={5}
            disabled={isSubmitting}
            className={cn(
              "resize-none",
              errors.jobDescription && "border-destructive focus-visible:ring-destructive"
            )}
            {...register('jobDescription')}
          />
          {errors.jobDescription && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.jobDescription.message}
            </p>
          )}
        </div>

        {/* Resume Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Resume <span className="text-destructive">*</span>
          </Label>
          <FileUploadDropzone
            file={file}
            onFileSelect={handleFileSelect}
            error={fileError || undefined}
            disabled={isSubmitting}
          />
        </div>

        {/* Error Message */}
        {submitState === 'error' && errorMessage && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Submission Failed</p>
                <p className="text-sm text-destructive/80 mt-1 break-words">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {submitState === 'success' && !screeningResult && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-success">Resume Submitted Successfully!</p>
                <p className="text-sm text-success/80 mt-1">
                  You will receive an email shortly with further instructions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex-1 h-12 text-base font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit for Screening
              </>
            )}
          </Button>

          {(submitState === 'success' || submitState === 'error') && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-12"
            >
              Start Over
            </Button>
          )}
        </div>
      </form>

      {/* Screening Result */}
      {screeningResult && (
        <div className="mt-10 pt-10 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Screening Results</h2>
            {emailSent && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>Email sent</span>
              </div>
            )}
          </div>
          <ScreeningResult result={screeningResult} />
        </div>
      )}
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUploadDropzone } from './FileUploadDropzone';
import { ScreeningResult } from './ScreeningResult';
import { 
  resumeFormSchema, 
  ResumeFormData, 
  screeningResultSchema,
  ScreeningResult as ScreeningResultType,
  getErrorMessage 
} from '@/lib/validations';
import { cn } from '@/lib/utils';

const N8N_WEBHOOK_URL = 'https://suhaibbb.app.n8n.cloud/webhook/screen-resume';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function ResumeUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [screeningResult, setScreeningResult] = useState<ScreeningResultType | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
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
    }
  }, [screeningResult]);

  const onSubmit = async (data: ResumeFormData) => {
    if (!file) {
      setFileError('Please upload your resume');
      return;
    }

    setSubmitState('submitting');
    setErrorMessage(null);
    setScreeningResult(null);

    try {
      const formData = new FormData();
      formData.append('Resume_PDF_only_', file);
      formData.append('Email Address', data.email);
      formData.append('Full Name', data.fullName);
      formData.append('job_description', data.jobDescription);

      console.log('Submitting to n8n webhook:', N8N_WEBHOOK_URL);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      // Handle specific error codes
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      
      if (response.status === 402) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMessage = `Server responded with status ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) errorMessage = errorData.error;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      // Get response as text first to handle empty responses
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!responseText || responseText.trim() === '') {
        throw new Error('The screening service returned an empty response. Please try again.');
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('The screening service returned an invalid response format.');
      }

      console.log('Parsed response:', responseData);

      // Check for error in response
      if (responseData.error) {
        throw new Error(responseData.error);
      }

      // Handle if n8n returns an array (take first item)
      const resultData = Array.isArray(responseData) ? responseData[0] : responseData;

      // Validate response against schema
      const parseResult = screeningResultSchema.safeParse(resultData);
      
      if (!parseResult.success) {
        console.error('Invalid response schema:', parseResult.error.issues);
        console.error('Received data:', resultData);
        throw new Error('Analysis failed — the screening service returned an unexpected response format.');
      }

      setScreeningResult(parseResult.data);
      setSubmitState('success');
    } catch (error) {
      console.error('Submission error:', error);
      setErrorMessage(getErrorMessage(error));
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
              <div>
                <p className="text-sm font-medium text-destructive">Submission Failed</p>
                <p className="text-sm text-destructive/80 mt-1">{errorMessage}</p>
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
          <h2 className="text-xl font-semibold text-foreground mb-6">Screening Results</h2>
          <ScreeningResult result={screeningResult} />
        </div>
      )}
    </div>
  );
}

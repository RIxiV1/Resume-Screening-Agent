import { z } from 'zod';

// Email validation regex (RFC-compliant)
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Block placeholder emails
const placeholderEmails = ['fallback@email.com', 'test@test.com', 'example@example.com'];

export const resumeFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: "Full name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .max(255, { message: "Email must be less than 255 characters" })
    .refine((val) => emailRegex.test(val), {
      message: "Please enter a valid email address.",
    })
    .refine((val) => !placeholderEmails.includes(val.toLowerCase()), {
      message: "Please use a real email address.",
    }),
  jobDescription: z
    .string()
    .trim()
    .min(1, { message: "Job description is required" })
    .max(10000, { message: "Job description must be less than 10,000 characters" }),
});

export type ResumeFormData = z.infer<typeof resumeFormSchema>;

// PDF validation
export const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'pdf') {
    return { valid: false, error: "Please upload a PDF resume only." };
  }

  // Check MIME type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: "Please upload a PDF resume only." };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }

  return { valid: true };
}

// Response schema from n8n webhook
export const screeningResultSchema = z.object({
  overall_score: z.number().min(0).max(100),
  verdict: z.string(),
  short_reason: z.string(),
  recommended_next_steps: z.string(),
  // Optional fields from n8n
  confidence: z.number().min(0).max(1).optional(),
  matched_skills: z.array(z.string()).optional(),
  years_relevant_experience: z.number().optional(),
  calendar_link: z.string().optional(),
  email_draft: z.string().optional(),
});

export type ScreeningResult = z.infer<typeof screeningResultSchema>;

// Error message mapping
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('invalid pdf') || msg.includes('pdf structure')) {
      return "We couldn't process this PDF. Please re-export the resume as a standard PDF and upload again.";
    }
    
    if (msg.includes('field name') || msg.includes('missing binary')) {
      return "Please re-upload your resume using the upload button (PDF required).";
    }
    
    if (msg.includes('referenced node') || msg.includes('cannot read properties') || msg.includes('json.parse')) {
      return "Temporary processing error — please try again in a few moments.";
    }
    
    if (msg.includes('mail delivery') || msg.includes('email bounce')) {
      return "We attempted to send you an email but it failed. Please check the email address or contact support.";
    }
  }
  
  return "An unexpected error occurred. Please try again.";
}

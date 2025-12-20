import { z } from 'zod';

/**
 * N8N RESPONSE MAPPING
 * =====================
 * This file centralizes all mappings between the n8n webhook response and the app's data structure.
 * If you change the n8n response shape, update the schemas here.
 * 
 * CURRENT N8N RESPONSE FORMAT:
 * {
 *   "overall_score": number (0-100),
 *   "verdict": string ("interview" | "hold" | "reject"),
 *   "confidence": number (0-100),
 *   "summary": string (optional),
 *   "matched_skills": string[],
 *   "years_relevant_experience": number,
 *   "short_reason": string,
 *   "recommended_next_steps": string[]
 * }
 */

// Raw n8n response schema - matches exactly what n8n returns
export const n8nRawResponseSchema = z.object({
  overall_score: z.number().min(0).max(100),
  verdict: z.string(),
  confidence: z.number().min(0).max(100).optional(),
  summary: z.string().optional(),
  matched_skills: z.array(z.string()).optional(),
  years_relevant_experience: z.number().optional(),
  short_reason: z.string(),
  recommended_next_steps: z.union([
    z.string(),
    z.array(z.string())
  ]),
  // Optional bonus fields
  calendar_link: z.string().optional(),
  email_draft: z.string().optional(),
});

export type N8nRawResponse = z.infer<typeof n8nRawResponseSchema>;

// Normalized app response - what the UI components expect
export interface ScreeningResult {
  overall_score: number;
  verdict: string;
  normalizedVerdict: 'Interview' | 'Hold' | 'Reject' | 'Unknown';
  confidence: number; // 0-100 scale
  summary: string;
  matched_skills: string[];
  years_relevant_experience: number;
  short_reason: string;
  recommended_next_steps: string[];
  // Optional fields
  calendar_link?: string;
  email_draft?: string;
}

/**
 * Normalizes the verdict string to a consistent format
 */
function normalizeVerdict(verdict: string): 'Interview' | 'Hold' | 'Reject' | 'Unknown' {
  const v = verdict.toLowerCase().trim();
  if (v === 'interview' || v === 'proceed' || v === 'yes') return 'Interview';
  if (v === 'hold' || v === 'maybe' || v === 'pending') return 'Hold';
  if (v === 'reject' || v === 'no' || v === 'pass') return 'Reject';
  return 'Unknown';
}

/**
 * Maps the raw n8n response to the normalized app format
 * 
 * @param rawResponse - The raw response from n8n webhook
 * @returns Normalized ScreeningResult for UI consumption
 */
export function mapN8nResponse(rawResponse: N8nRawResponse): ScreeningResult {
  return {
    overall_score: rawResponse.overall_score,
    verdict: rawResponse.verdict,
    normalizedVerdict: normalizeVerdict(rawResponse.verdict),
    // Confidence comes as 0-100 from n8n, keep as-is
    confidence: rawResponse.confidence ?? 0,
    // Use summary if provided, otherwise fall back to short_reason
    summary: rawResponse.summary || rawResponse.short_reason,
    matched_skills: rawResponse.matched_skills || [],
    years_relevant_experience: rawResponse.years_relevant_experience ?? 0,
    short_reason: rawResponse.short_reason,
    // Handle both string and array formats for recommended_next_steps
    recommended_next_steps: Array.isArray(rawResponse.recommended_next_steps)
      ? rawResponse.recommended_next_steps
      : [rawResponse.recommended_next_steps],
    calendar_link: rawResponse.calendar_link,
    email_draft: rawResponse.email_draft,
  };
}

/**
 * Parses and validates the n8n response
 * 
 * @param data - Raw data from n8n webhook
 * @returns Parsed and validated response or null if invalid
 */
export function parseN8nResponse(data: unknown): { success: true; data: ScreeningResult } | { success: false; error: string } {
  // Handle array responses (n8n sometimes wraps in array)
  const responseData = Array.isArray(data) ? data[0] : data;
  
  const parseResult = n8nRawResponseSchema.safeParse(responseData);
  
  if (!parseResult.success) {
    console.error('N8n response validation failed:', parseResult.error.issues);
    console.error('Received data:', responseData);
    return {
      success: false,
      error: `Invalid response format: ${parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`
    };
  }
  
  return {
    success: true,
    data: mapN8nResponse(parseResult.data)
  };
}

/**
 * Determines if the candidate should receive an interview invitation
 */
export function shouldSendInterviewInvitation(result: ScreeningResult): boolean {
  return result.normalizedVerdict === 'Interview' || result.overall_score >= 70;
}

/**
 * Determines if the candidate should receive a rejection email
 */
export function shouldSendRejectionEmail(result: ScreeningResult): boolean {
  return result.normalizedVerdict === 'Reject' || result.overall_score < 40;
}

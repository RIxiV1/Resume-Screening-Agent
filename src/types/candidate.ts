export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  score: number;
  verdict: 'interview' | 'reject' | 'hold';
  submittedAt: string;
  avatarUrl?: string;
  // Full screening details
  confidence?: number;
  summary?: string;
  matched_skills?: string[];
  years_relevant_experience?: number;
  short_reason?: string;
  recommended_next_steps?: string[];
  email_draft?: string;
  interview_email_sent?: boolean;
  rejection_email_sent?: boolean;
}

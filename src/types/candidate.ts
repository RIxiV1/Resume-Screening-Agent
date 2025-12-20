export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  score: number;
  verdict: 'interview' | 'reject' | 'hold';
  submittedAt: string;
  avatarUrl?: string;
}

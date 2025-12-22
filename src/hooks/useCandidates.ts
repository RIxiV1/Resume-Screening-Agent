import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/types/candidate';
import { toast } from 'sonner';

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedCandidates: Candidate[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        score: row.score,
        verdict: row.verdict as 'interview' | 'reject' | 'hold',
        submittedAt: new Date(row.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(row.name)}`,
        confidence: row.confidence ?? undefined,
        summary: row.summary ?? undefined,
        matched_skills: row.matched_skills ?? undefined,
        years_relevant_experience: row.years_relevant_experience ?? undefined,
        short_reason: row.short_reason ?? undefined,
        recommended_next_steps: row.recommended_next_steps ?? undefined,
        email_draft: row.email_draft ?? undefined,
        interview_email_sent: row.interview_email_sent,
        rejection_email_sent: row.rejection_email_sent,
      }));

      setCandidates(mappedCandidates);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEmailStatus = useCallback(async (
    candidateId: string,
    type: 'interview' | 'rejection'
  ) => {
    const column = type === 'interview' ? 'interview_email_sent' : 'rejection_email_sent';
    
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ [column]: true })
      .eq('id', candidateId);

    if (updateError) {
      throw updateError;
    }

    // Update local state
    setCandidates(prev => prev.map(c => 
      c.id === candidateId 
        ? { ...c, [type === 'interview' ? 'interview_email_sent' : 'rejection_email_sent']: true }
        : c
    ));
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return {
    candidates,
    loading,
    error,
    refetch: fetchCandidates,
    updateEmailStatus,
  };
}

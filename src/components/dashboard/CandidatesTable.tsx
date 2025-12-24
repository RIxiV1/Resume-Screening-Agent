import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Candidate } from '@/types/candidate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, UserX, CheckCircle2 } from 'lucide-react';

interface CandidatesTableProps {
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
  onEmailStatusUpdate: (candidateId: string, type: 'interview' | 'rejection') => Promise<void>;
}

export function CandidatesTable({ candidates, onCandidateClick, onEmailStatusUpdate }: CandidatesTableProps) {
  const [sendingEmail, setSendingEmail] = useState<Record<string, 'interview' | 'rejection' | null>>({});

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getVerdictBadge = (verdict: Candidate['verdict']) => {
    switch (verdict) {
      case 'interview':
        return (
          <Badge className="bg-success/10 text-success border-success/30 hover:bg-success/20">
            Interview
          </Badge>
        );
      case 'reject':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20">
            Reject
          </Badge>
        );
      case 'hold':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30 hover:bg-warning/20">
            Hold
          </Badge>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const handleSendEmail = async (
    e: React.MouseEvent, 
    candidate: Candidate, 
    type: 'interview' | 'rejection'
  ) => {
    e.stopPropagation();
    setSendingEmail((prev) => ({ ...prev, [candidate.id]: type }));
    
    try {
      const { data, error } = await supabase.functions.invoke('send-candidate-email', {
        body: {
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          result: {
            overall_score: candidate.score,
            verdict: candidate.verdict,
            normalizedVerdict: candidate.verdict === 'interview' ? 'Interview' : 
                               candidate.verdict === 'reject' ? 'Reject' : 'Hold',
            short_reason: candidate.short_reason || '',
            recommended_next_steps: candidate.recommended_next_steps || [],
          },
        },
      });

      if (error) {
        throw error;
      }

      await onEmailStatusUpdate(candidate.id, type);
      
      toast.success(
        type === 'interview'
          ? `Interview invitation sent to ${candidate.name}`
          : `Rejection email sent to ${candidate.name}`
      );
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSendingEmail((prev) => ({ ...prev, [candidate.id]: null }));
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-soft-sm">
      <div className="p-5 border-b border-border">
        <h2 className="font-semibold text-foreground">Candidates</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {candidates.length} application{candidates.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[220px]">Candidate</TableHead>
              <TableHead className="hidden md:table-cell">Role</TableHead>
              <TableHead className="text-center w-[80px]">Score</TableHead>
              <TableHead className="text-center w-[100px]">Verdict</TableHead>
              <TableHead className="hidden sm:table-cell w-[120px]">Submitted</TableHead>
              <TableHead className="text-right w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No candidates found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow 
                  key={candidate.id}
                  className="cursor-pointer"
                  onClick={() => onCandidateClick(candidate)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(candidate.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground truncate md:hidden">
                          {candidate.role.length > 30 ? candidate.role.substring(0, 30) + '...' : candidate.role}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-sm">
                      {candidate.role.length > 40 ? candidate.role.substring(0, 40) + '...' : candidate.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${getScoreColor(candidate.score)}`}>
                      {candidate.score}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{getVerdictBadge(candidate.verdict)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {candidate.submittedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleSendEmail(e, candidate, 'interview')}
                        disabled={
                          sendingEmail[candidate.id] !== undefined && 
                          sendingEmail[candidate.id] !== null ||
                          candidate.interview_email_sent
                        }
                        className="h-8 px-2.5 gap-1.5"
                      >
                        {candidate.interview_email_sent ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden lg:inline">
                          {sendingEmail[candidate.id] === 'interview' 
                            ? 'Sending...' 
                            : candidate.interview_email_sent 
                              ? 'Sent'
                              : 'Interview'}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleSendEmail(e, candidate, 'rejection')}
                        disabled={
                          sendingEmail[candidate.id] !== undefined && 
                          sendingEmail[candidate.id] !== null ||
                          candidate.rejection_email_sent
                        }
                        className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-destructive"
                      >
                        {candidate.rejection_email_sent ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <UserX className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden lg:inline">
                          {sendingEmail[candidate.id] === 'rejection' 
                            ? 'Sending...' 
                            : candidate.rejection_email_sent
                              ? 'Sent'
                              : 'Reject'}
                        </span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

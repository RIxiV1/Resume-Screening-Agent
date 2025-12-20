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
import { toast } from 'sonner';

interface CandidatesTableProps {
  candidates: Candidate[];
}

export function CandidatesTable({ candidates }: CandidatesTableProps) {
  const [sendingEmail, setSendingEmail] = useState<Record<string, 'interview' | 'rejection' | null>>({});

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getVerdictBadge = (verdict: Candidate['verdict']) => {
    switch (verdict) {
      case 'interview':
        return (
          <Badge className="bg-success text-success-foreground hover:bg-success/90">
            Interview
          </Badge>
        );
      case 'reject':
        return (
          <Badge variant="destructive">
            Reject
          </Badge>
        );
      case 'hold':
        return (
          <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">
            Hold
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleSendEmail = async (candidate: Candidate, type: 'interview' | 'rejection') => {
    setSendingEmail((prev) => ({ ...prev, [candidate.id]: type }));
    
    // Simulate email sending - in production, this would call the edge function
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success(
        type === 'interview'
          ? `Interview invitation sent to ${candidate.name}`
          : `Rejection email sent to ${candidate.name}`
      );
    } catch (error) {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSendingEmail((prev) => ({ ...prev, [candidate.id]: null }));
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Candidate Applications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of all submitted applications and their AI screening results.
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[250px]">Candidate</TableHead>
              <TableHead>Role / JD</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-center">Verdict</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No candidates match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {getInitials(candidate.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{candidate.role}</TableCell>
                  <TableCell className="text-center font-medium text-foreground">
                    {candidate.score}%
                  </TableCell>
                  <TableCell className="text-center">{getVerdictBadge(candidate.verdict)}</TableCell>
                  <TableCell className="text-muted-foreground">{candidate.submittedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmail(candidate, 'interview')}
                        disabled={sendingEmail[candidate.id] !== undefined && sendingEmail[candidate.id] !== null}
                      >
                        {sendingEmail[candidate.id] === 'interview' ? 'Sending...' : 'Send Interview Email'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSendEmail(candidate, 'rejection')}
                        disabled={sendingEmail[candidate.id] !== undefined && sendingEmail[candidate.id] !== null}
                      >
                        {sendingEmail[candidate.id] === 'rejection' ? 'Sending...' : 'Send Rejection Email'}
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

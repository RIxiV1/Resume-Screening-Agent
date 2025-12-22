import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Candidate } from '@/types/candidate';
import { CheckCircle2, XCircle, Clock, Briefcase, Star, ListChecks } from 'lucide-react';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateDetailModal({ candidate, open, onOpenChange }: CandidateDetailModalProps) {
  if (!candidate) return null;

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'interview':
        return { icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10', label: 'Interview' };
      case 'reject':
        return { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Reject' };
      case 'hold':
        return { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Hold' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Unknown' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const verdictConfig = getVerdictConfig(candidate.verdict);
  const VerdictIcon = verdictConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{candidate.name}</h2>
                <p className="text-sm text-muted-foreground">{candidate.email}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Score and Verdict */}
          <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(candidate.score)}`}>
                {candidate.score}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${verdictConfig.bgColor}`}>
                <VerdictIcon className={`w-5 h-5 ${verdictConfig.color}`} />
              </div>
              <div>
                <p className={`font-semibold ${verdictConfig.color}`}>{verdictConfig.label}</p>
                <p className="text-sm text-muted-foreground">Verdict</p>
              </div>
            </div>
            {candidate.confidence !== undefined && (
              <>
                <div className="h-12 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">{candidate.confidence}%</div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                </div>
              </>
            )}
          </div>

          {/* Role and Submission Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-card border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Applied For</p>
              <p className="font-medium text-foreground">{candidate.role}</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Submitted On</p>
              <p className="font-medium text-foreground">{candidate.submittedAt}</p>
            </div>
          </div>

          {/* Summary */}
          {candidate.summary && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-primary" />
                Summary
              </h3>
              <p className="text-muted-foreground">{candidate.summary}</p>
            </div>
          )}

          {/* Short Reason */}
          {candidate.short_reason && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Reason</h3>
              <p className="text-muted-foreground">{candidate.short_reason}</p>
            </div>
          )}

          {/* Experience */}
          {candidate.years_relevant_experience !== undefined && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Relevant Experience
              </h3>
              <p className="text-2xl font-bold text-primary">
                {candidate.years_relevant_experience} {candidate.years_relevant_experience === 1 ? 'year' : 'years'}
              </p>
            </div>
          )}

          {/* Matched Skills */}
          {candidate.matched_skills && candidate.matched_skills.length > 0 && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground mb-3">Matched Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.matched_skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Next Steps */}
          {candidate.recommended_next_steps && candidate.recommended_next_steps.length > 0 && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <ListChecks className="w-4 h-4 text-primary" />
                Recommended Next Steps
              </h3>
              <ul className="space-y-2">
                {candidate.recommended_next_steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Email Status */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {candidate.interview_email_sent && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="w-4 h-4" />
                Interview email sent
              </span>
            )}
            {candidate.rejection_email_sent && (
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="w-4 h-4" />
                Rejection email sent
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

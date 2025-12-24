import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Candidate } from '@/types/candidate';
import { CheckCircle2, XCircle, Clock, Briefcase, Star, ListChecks, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        return { icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/30', label: 'Interview' };
      case 'reject':
        return { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/30', label: 'Reject' };
      case 'hold':
        return { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30', label: 'Hold' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted', borderColor: 'border-border', label: 'Unknown' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
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
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{candidate.name}</h2>
                <p className="text-sm text-muted-foreground font-normal">{candidate.email}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Score and Verdict */}
          <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-xl">
            <div className="text-center">
              <div className={cn("text-3xl font-bold", getScoreColor(candidate.score))}>
                {candidate.score}%
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Score</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <div className={cn("p-2 rounded-lg", verdictConfig.bgColor)}>
                <VerdictIcon className={cn("w-4 h-4", verdictConfig.color)} />
              </div>
              <div>
                <p className={cn("font-semibold text-sm", verdictConfig.color)}>{verdictConfig.label}</p>
                <p className="text-xs text-muted-foreground">Verdict</p>
              </div>
            </div>
            {candidate.confidence !== undefined && candidate.confidence > 0 && (
              <>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground">{candidate.confidence}%</div>
                  <p className="text-xs text-muted-foreground mt-0.5">Confidence</p>
                </div>
              </>
            )}
          </div>

          {/* Role and Submission Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-card border border-border rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Applied For</p>
              <p className="font-medium text-foreground text-sm">{candidate.role}</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Submitted</p>
              <p className="font-medium text-foreground text-sm">{candidate.submittedAt}</p>
            </div>
          </div>

          {/* Summary */}
          {candidate.summary && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2 text-sm">
                <Star className="w-4 h-4 text-primary" />
                Summary
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{candidate.summary}</p>
            </div>
          )}

          {/* Short Reason */}
          {candidate.short_reason && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Reason</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{candidate.short_reason}</p>
            </div>
          )}

          {/* Experience */}
          {candidate.years_relevant_experience !== undefined && candidate.years_relevant_experience > 0 && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2 text-sm">
                <Briefcase className="w-4 h-4 text-primary" />
                Relevant Experience
              </h3>
              <p className="text-2xl font-bold text-primary">
                {candidate.years_relevant_experience} <span className="text-base font-normal text-muted-foreground">years</span>
              </p>
            </div>
          )}

          {/* Matched Skills */}
          {candidate.matched_skills && candidate.matched_skills.length > 0 && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Matched Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.matched_skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Next Steps */}
          {candidate.recommended_next_steps && candidate.recommended_next_steps.length > 0 && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
                <ListChecks className="w-4 h-4 text-primary" />
                Recommended Next Steps
              </h3>
              <ul className="space-y-2">
                {candidate.recommended_next_steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-muted-foreground text-sm">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Email Status */}
          {(candidate.interview_email_sent || candidate.rejection_email_sent) && (
            <div className="flex items-center gap-4 text-sm pt-2">
              {candidate.interview_email_sent && (
                <span className="flex items-center gap-1.5 text-success">
                  <Mail className="w-4 h-4" />
                  Interview email sent
                </span>
              )}
              {candidate.rejection_email_sent && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  Rejection email sent
                </span>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

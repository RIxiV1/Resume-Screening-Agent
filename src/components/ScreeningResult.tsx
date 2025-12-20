import { ScreeningResult as ScreeningResultType } from '@/lib/validations';
import { CheckCircle2, XCircle, Clock, Target, Briefcase, Lightbulb, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScreeningResultProps {
  result: ScreeningResultType;
}

export function ScreeningResult({ result }: ScreeningResultProps) {
  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'Interview':
        return {
          icon: CheckCircle2,
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          label: 'Recommended for Interview',
        };
      case 'Hold':
        return {
          icon: Clock,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          label: 'On Hold',
        };
      case 'Reject':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          label: 'Not a Match',
        };
      default:
        return {
          icon: Target,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          label: verdict,
        };
    }
  };

  const verdictConfig = getVerdictConfig(result.verdict);
  const VerdictIcon = verdictConfig.icon;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 70) return 'from-success to-success/70';
    if (score >= 40) return 'from-warning to-warning/70';
    return 'from-destructive to-destructive/70';
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header with Score and Verdict */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-card rounded-xl border border-border shadow-soft-md">
        {/* Score Circle */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              className="stroke-muted"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              className={cn("stroke-current", getScoreColor(result.overall_score))}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(result.overall_score / 100) * 352} 352`}
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", getScoreColor(result.overall_score))}>
              {result.overall_score}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Score</span>
          </div>
        </div>

        {/* Verdict */}
        <div className="flex-1 text-center sm:text-left">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-3",
            verdictConfig.bgColor,
            verdictConfig.borderColor
          )}>
            <VerdictIcon className={cn("w-5 h-5", verdictConfig.color)} />
            <span className={cn("font-semibold", verdictConfig.color)}>
              {verdictConfig.label}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Confidence: {Math.round(result.confidence * 100)}%
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="p-5 bg-card rounded-xl border border-border shadow-soft-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Summary</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {result.short_reason}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Experience */}
        <div className="p-5 bg-card rounded-xl border border-border shadow-soft-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Briefcase className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Experience</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {result.years_relevant_experience} <span className="text-base font-normal text-muted-foreground">years</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Relevant experience</p>
        </div>

        {/* Matched Skills */}
        <div className="p-5 bg-card rounded-xl border border-border shadow-soft-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">Matched Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.matched_skills.length > 0 ? (
              result.matched_skills.slice(0, 6).map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 text-xs font-medium bg-success/10 text-success rounded-full"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No skills matched</span>
            )}
            {result.matched_skills.length > 6 && (
              <span className="px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                +{result.matched_skills.length - 6} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
        <h3 className="font-semibold text-foreground mb-2">Recommended Next Steps</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {result.recommended_next_steps}
        </p>
      </div>
    </div>
  );
}

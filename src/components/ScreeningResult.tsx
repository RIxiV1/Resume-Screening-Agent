import { ScreeningResult as ScreeningResultType } from '@/lib/n8nResponseMapper';
import { CheckCircle2, XCircle, Clock, Lightbulb, Briefcase, TrendingUp, Calendar, Mail, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from './ui/button';

interface ScreeningResultProps {
  result: ScreeningResultType;
}

export function ScreeningResult({ result }: ScreeningResultProps) {
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  const getVerdictConfig = (normalizedVerdict: string) => {
    switch (normalizedVerdict) {
      case 'Interview':
        return {
          icon: CheckCircle2,
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
          label: 'Interview Recommended',
        };
      case 'Hold':
        return {
          icon: Clock,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/30',
          label: 'On Hold',
        };
      case 'Reject':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          label: 'Not a Match',
        };
      default:
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          label: result.verdict,
        };
    }
  };

  const verdictConfig = getVerdictConfig(result.normalizedVerdict);
  const VerdictIcon = verdictConfig.icon;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 70) return 'stroke-success';
    if (score >= 40) return 'stroke-warning';
    return 'stroke-destructive';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.email_draft || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Two-column layout on desktop */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column - Score & Key Stats */}
        <div className="lg:col-span-2 space-y-4">
          {/* Score Ring Card */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft-sm">
            <div className="flex flex-col items-center text-center">
              {/* Score Circle */}
              <div className="relative w-36 h-36 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-muted"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className={cn("transition-all duration-1000", getScoreRingColor(result.overall_score))}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.overall_score / 100) * 402} 402`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-4xl font-bold", getScoreColor(result.overall_score))}>
                    {result.overall_score}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Score</span>
                </div>
              </div>

              {/* Verdict Pill */}
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border",
                verdictConfig.bgColor,
                verdictConfig.borderColor
              )}>
                <VerdictIcon className={cn("w-4 h-4", verdictConfig.color)} />
                <span className={cn("font-semibold text-sm", verdictConfig.color)}>
                  {verdictConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            {result.confidence > 0 && (
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Confidence</p>
                <p className="text-2xl font-bold text-foreground">{result.confidence}%</p>
              </div>
            )}
            {result.years_relevant_experience > 0 && (
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Experience</p>
                <p className="text-2xl font-bold text-foreground">{result.years_relevant_experience} <span className="text-base font-normal text-muted-foreground">yrs</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Details */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary Card */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-soft-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Summary</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Matched Skills */}
          {result.matched_skills.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 shadow-soft-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <h3 className="font-semibold text-foreground">Strengths & Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.matched_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-xs font-medium bg-success/10 text-success rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {result.recommended_next_steps.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 shadow-soft-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Recommended Next Steps</h3>
              </div>
              <ul className="space-y-2.5">
                {result.recommended_next_steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-muted-foreground text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Link & Email Draft */}
      {(result.calendar_link || result.email_draft) && (
        <div className="flex flex-wrap gap-3">
          {result.calendar_link && result.normalizedVerdict === 'Interview' && (
            <a
              href={result.calendar_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Calendar className="w-4 h-4" />
              Schedule Interview
            </a>
          )}
          
          {result.email_draft && (
            <Button
              variant="outline"
              onClick={() => setShowEmailDraft(!showEmailDraft)}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              {showEmailDraft ? 'Hide Email Draft' : 'View Email Draft'}
            </Button>
          )}
        </div>
      )}

      {/* Email Draft Content */}
      {showEmailDraft && result.email_draft && (
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft-sm animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground">Suggested Email to Candidate</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-2 h-8"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/50 p-4 rounded-lg border border-border">
            {result.email_draft}
          </pre>
        </div>
      )}
    </div>
  );
}

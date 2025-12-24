import { useState, useMemo } from 'react';
import { Loader2, Users, TrendingUp, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CandidateFilters } from '@/components/dashboard/CandidateFilters';
import { CandidatesTable } from '@/components/dashboard/CandidatesTable';
import { CandidateDetailModal } from '@/components/dashboard/CandidateDetailModal';
import { useCandidates } from '@/hooks/useCandidates';
import { Candidate } from '@/types/candidate';

const Dashboard = () => {
  const { candidates, loading, error, refetch, updateEmailStatus } = useCandidates();
  const [roleFilter, setRoleFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const roles = useMemo(() => [...new Set(candidates.map((c) => c.role))], [candidates]);

  const filteredCandidates = useMemo(() => {
    let filtered = candidates;
    
    if (roleFilter) {
      filtered = filtered.filter((c) => c.role === roleFilter);
    }
    
    filtered = filtered.filter((c) => c.score >= minScoreFilter);
    return filtered;
  }, [candidates, roleFilter, minScoreFilter]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const avgScore = total > 0 ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / total) : 0;
    const interviewReady = candidates.filter(c => c.verdict === 'interview').length;
    return { total, avgScore, interviewReady };
  }, [candidates]);

  const handleApplyFilters = (role: string, minScore: number) => {
    setRoleFilter(role);
    setMinScoreFilter(minScore);
  };

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            HR Dashboard
          </h1>
          <p className="text-muted-foreground">
            Review and manage screened candidate applications.
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-5 shadow-soft-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Candidates</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 shadow-soft-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-success/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 shadow-soft-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-warning/10 rounded-lg">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.interviewReady}</p>
                  <p className="text-sm text-muted-foreground">Interview Ready</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading candidates...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-5 bg-destructive/10 border border-destructive/20 rounded-xl mb-6">
            <p className="text-destructive font-medium">{error}</p>
            <button 
              onClick={refetch}
              className="mt-2 text-sm text-primary hover:underline font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Filters */}
            <CandidateFilters roles={roles} onApplyFilters={handleApplyFilters} />

            {/* Candidates Table */}
            <CandidatesTable 
              candidates={filteredCandidates} 
              onCandidateClick={handleCandidateClick}
              onEmailStatusUpdate={updateEmailStatus}
            />
          </>
        )}
      </main>

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
};

export default Dashboard;

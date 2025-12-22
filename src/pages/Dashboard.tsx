import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, Loader2 } from 'lucide-react';
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

  const handleApplyFilters = (role: string, minScore: number) => {
    setRoleFilter(role);
    setMinScoreFilter(minScore);
  };

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <FileSearch className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">ResumeScreen</span>
            </Link>
            <nav>
              <Link 
                to="/dashboard" 
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Candidate Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            HR Review Dashboard
          </h1>
          <p className="text-muted-foreground">
            Review and manage candidate applications efficiently.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading candidates...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
            <p className="text-destructive">{error}</p>
            <button 
              onClick={refetch}
              className="mt-2 text-sm text-primary hover:underline"
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

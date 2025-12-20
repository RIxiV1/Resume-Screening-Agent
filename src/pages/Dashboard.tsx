import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch } from 'lucide-react';
import { CandidateFilters } from '@/components/dashboard/CandidateFilters';
import { CandidatesTable } from '@/components/dashboard/CandidatesTable';
import { Candidate } from '@/types/candidate';

// Mock data for demonstration
const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Software Engineer - Frontend',
    score: 87,
    verdict: 'interview',
    submittedAt: '2024-07-23',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
  },
  {
    id: '2',
    name: 'Bob Williams',
    email: 'bob@example.com',
    role: 'Product Manager',
    score: 62,
    verdict: 'reject',
    submittedAt: '2024-07-22',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'UI/UX Designer',
    score: 91,
    verdict: 'interview',
    submittedAt: '2024-07-21',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
  },
  {
    id: '4',
    name: 'Diana Miller',
    email: 'diana@example.com',
    role: 'Data Scientist',
    score: 78,
    verdict: 'interview',
    submittedAt: '2024-07-20',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
  },
  {
    id: '5',
    name: 'Ethan Davis',
    email: 'ethan@example.com',
    role: 'Marketing Specialist',
    score: 55,
    verdict: 'reject',
    submittedAt: '2024-07-19',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan',
  },
];

const Dashboard = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(mockCandidates);

  const roles = [...new Set(mockCandidates.map((c) => c.role))];

  const handleApplyFilters = (role: string, minScore: number) => {
    let filtered = candidates;
    
    if (role) {
      filtered = filtered.filter((c) => c.role === role);
    }
    
    filtered = filtered.filter((c) => c.score >= minScore);
    setFilteredCandidates(filtered);
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
            Welcome back, Sarah. Review and manage candidate applications efficiently.
          </p>
        </div>

        {/* Filters */}
        <CandidateFilters roles={roles} onApplyFilters={handleApplyFilters} />

        {/* Candidates Table */}
        <CandidatesTable candidates={filteredCandidates} />
      </main>
    </div>
  );
};

export default Dashboard;

import { ResumeUploadForm } from '@/components/ResumeUploadForm';
import { FileSearch, Zap, Shield, Clock } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <FileSearch className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">ResumeScreen</span>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            AI-Powered Resume Screening
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Upload your resume and job description to get instant AI analysis. 
            Discover your match score, key skills alignment, and personalized recommendations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 lg:mb-16">
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
            <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Instant Analysis</p>
              <p className="text-xs text-muted-foreground">Results in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
            <div className="p-2.5 bg-accent/10 rounded-lg flex-shrink-0">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Secure & Private</p>
              <p className="text-xs text-muted-foreground">Data encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
            <div className="p-2.5 bg-success/10 rounded-lg flex-shrink-0">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Save Time</p>
              <p className="text-xs text-muted-foreground">Skip manual review</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-soft-lg p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Submit Your Application
              </h2>
              <p className="text-sm text-muted-foreground">
                Fill in your details and upload your resume to get started.
              </p>
            </div>
            <ResumeUploadForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Powered by AI • Your data is processed securely and not stored
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

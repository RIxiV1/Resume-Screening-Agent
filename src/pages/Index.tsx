import { Header } from '@/components/layout/Header';
import { ResumeUploadForm } from '@/components/ResumeUploadForm';
import { Zap, Shield, Lock } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">
          {/* Left side - Benefits panel (visible on large screens) */}
          <div className="hidden lg:block lg:col-span-2 sticky top-28">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
                  AI-Powered<br />Resume Screening
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  Get instant insights on candidate fit. Save hours of manual screening with our intelligent analysis.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border shadow-soft-sm">
                  <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-0.5">Instant AI Scoring</h3>
                    <p className="text-sm text-muted-foreground">Get detailed match scores and skill analysis in seconds.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border shadow-soft-sm">
                  <div className="p-2.5 bg-success/10 rounded-lg shrink-0">
                    <Shield className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-0.5">Unbiased Analysis</h3>
                    <p className="text-sm text-muted-foreground">Consistent evaluation based purely on skills and experience.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border shadow-soft-sm">
                  <div className="p-2.5 bg-muted rounded-lg shrink-0">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-0.5">Secure & Private</h3>
                    <p className="text-sm text-muted-foreground">Your data is encrypted and never stored permanently.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form card */}
          <div className="lg:col-span-3">
            {/* Mobile hero */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                AI-Powered Resume Screening
              </h1>
              <p className="text-muted-foreground">
                Upload your resume and job description for instant AI analysis.
              </p>
            </div>

            {/* Main form card */}
            <div className="bg-card rounded-2xl border border-border shadow-soft-lg">
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Submit Application
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Fill in your details and upload your resume to get started.
                  </p>
                </div>
                <ResumeUploadForm />
              </div>
            </div>

            {/* Privacy note */}
            <p className="text-center text-xs text-muted-foreground mt-6 px-4">
              By submitting, you agree to our processing of your data for screening purposes. 
              Your information is encrypted and handled securely.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 ResumeScreen • Powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

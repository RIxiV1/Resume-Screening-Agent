import { Link, useLocation } from 'react-router-dom';
import { FileSearch, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isDashboard = location.pathname === '/dashboard';
  const isAuthPage = location.pathname === '/auth';

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-primary rounded-lg transition-transform group-hover:scale-105">
              <FileSearch className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">ResumeScreen</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-1">
            {!isAuthPage && (
              <nav className="mr-2 flex items-center gap-2">
                <Link 
                  to={isDashboard ? '/' : '/dashboard'}
                  className={cn(
                    "text-sm font-medium px-3 py-2 rounded-lg transition-colors",
                    "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {isDashboard ? 'Submit Resume' : 'HR Dashboard'}
                </Link>
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </Button>
                )}
              </nav>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

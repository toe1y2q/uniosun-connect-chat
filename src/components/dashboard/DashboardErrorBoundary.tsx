import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  timeout?: boolean;
}

const DashboardErrorBoundary: React.FC<DashboardErrorBoundaryProps> = ({
  children,
  loading = false,
  error = null,
  onRetry,
  timeout = false
}) => {
  const { signOut } = useAuth();
  const [autoLogoutTimer, setAutoLogoutTimer] = React.useState<number | null>(null);

  React.useEffect(() => {
    // If loading takes more than 30 seconds, show timeout error
    if (loading && !autoLogoutTimer) {
      const timer = window.setTimeout(() => {
        setAutoLogoutTimer(30);
        toast.error('Dashboard is taking too long to load. Please try refreshing or logging out.');
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [loading, autoLogoutTimer]);

  const handleAutoLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully. Please log back in.');
    } catch (err) {
      toast.error('Failed to logout. Please refresh the page.');
    }
  };

  if (error || timeout || autoLogoutTimer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Dashboard Loading Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground">
              {error && (
                <p>An error occurred while loading your dashboard: {error.message}</p>
              )}
              {(timeout || autoLogoutTimer) && (
                <>
                  <p>Your dashboard is taking longer than expected to load. This might be due to:</p>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>• Slow internet connection</li>
                    <li>• Server temporarily unavailable</li>
                    <li>• Session expired</li>
                  </ul>
                </>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              {onRetry && (
                <Button onClick={onRetry} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button 
                onClick={handleAutoLogout} 
                variant="destructive" 
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout & Sign In Again
              </Button>
              
              <Button 
                onClick={() => window.location.reload()} 
                variant="secondary" 
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default DashboardErrorBoundary;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import AspirantDashboard from "@/components/dashboard/AspirantDashboard";
import EmployerDashboard from "@/components/dashboard/EmployerDashboard";
import Navigation from "@/components/Navigation";
import HomePage from "@/pages/HomePage";
import TalentsPage from "@/pages/TalentsPage";
import StudentDetailPage from "@/pages/StudentDetailPage";
import ProfileSettingsPage from "@/pages/ProfileSettingsPage";
import AdminPage from "@/pages/AdminPage";
import QuizPage from "@/pages/QuizPage";
import UserManagementPage from "@/pages/UserManagementPage";
import WithdrawalManagementPage from "@/pages/WithdrawalManagementPage";
import ChatPage from "@/pages/ChatPage";
import RatingReviewPage from "@/pages/RatingReviewPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import WithdrawalsPage from "@/pages/WithdrawalsPage";
import BrowseGigsPage from "@/pages/BrowseGigsPage";
import PostGigPage from "@/pages/PostGigPage";
import GigDetailPage from "@/pages/GigDetailPage";
import NotFound from "./pages/NotFound";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useState, useEffect } from "react";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import { InstallPrompt } from "@/components/ui/install-prompt";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const [forceShowApp, setForceShowApp] = useState(false);

  console.log('App state:', { user: !!user, profile, loading, forceShowApp });

  // Add timeout fallback for loading state to prevent permanent stuck state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !forceShowApp) {
        console.warn('Loading timeout reached - forcing app to show to prevent permanent loading');
        setForceShowApp(true);
      }
    }, 12000); // 12 second timeout

    return () => clearTimeout(timeout);
  }, [loading, forceShowApp]);

  // Reset forceShowApp when loading changes
  useEffect(() => {
    if (!loading) {
      setForceShowApp(false);
    }
  }, [loading]);

  if (loading && !forceShowApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner 
            message="Connecting to Hireveno..." 
            size="lg"
          />
          <p className="mt-4 text-sm text-muted-foreground">
            If this takes too long, try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationSystem />
      {showInstallPrompt && (
        <InstallPrompt onDismiss={() => setShowInstallPrompt(false)} />
      )}
      <Routes>
        <Route path="/" element={
          !user ? (
            showAuth ? (
              <AuthForm onBack={() => setShowAuth(false)} />
            ) : (
              <HomePage onGetStarted={() => setShowAuth(true)} />
            )
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />
        
        <Route path="/talents" element={
          <TalentsPage onAuthRequired={() => setShowAuth(true)} />
        } />

        <Route path="/gigs" element={
          <BrowseGigsPage />
        } />

        <Route path="/gig/:id" element={
          <GigDetailPage />
        } />
        
        <Route path="/student/:id" element={
          <StudentDetailPage />
        } />
        
        <Route path="/auth" element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthForm />
          )
        } />

        {/* Standalone Admin Route */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Admin Management Routes */}
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/withdrawals" element={<WithdrawalManagementPage />} />

        {/* Quiz Route */}
        <Route path="/quiz" element={
          user ? (
            <QuizPage />
          ) : (
            <Navigate to="/auth" replace />
          )
        } />

        {/* Chat Route */}
        <Route path="/chat/:sessionId" element={
          user ? (
            <ChatPage />
          ) : (
            <Navigate to="/auth" replace />
          )
        } />

        {/* Review Route */}
        <Route path="/rating-review/:sessionId" element={
          user ? (
            <RatingReviewPage />
          ) : (
            <Navigate to="/auth" replace />
          )
        } />

        <Route path="/profile-settings" element={
          user ? (
            <div className="min-h-screen bg-background">
              <Navigation />
              <ProfileSettingsPage />
            </div>
          ) : (
            <Navigate to="/auth" replace />
          )
        } />

        {/* Post Gig Route */}
        <Route path="/post-gig" element={
          user ? (
            <PostGigPage />
          ) : (
            <Navigate to="/auth" replace />
          )
        } />
        
        <Route path="/dashboard" element={
          user ? (
            <div className="min-h-screen bg-background">
              <Navigation />
              {!profile ? (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center p-4 sm:p-8">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Setting up your profile...</h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">This may take a moment for new accounts.</p>
                    <LoadingSpinner message="Loading your profile..." />
                  </div>
                </div>
              ) : (
                <>
                  {profile.role === 'student' && <StudentDashboard />}
                  {profile.role === 'aspirant' && <AspirantDashboard />}
                  {profile.role === 'employer' && <EmployerDashboard />}
                  {profile.role === 'admin' && (
                    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Admin Access Available</h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4">You have administrator privileges. Access the admin panel for advanced features.</p>
                        <button 
                          onClick={() => window.location.href = '/admin'}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium text-sm"
                        >
                          Go to Admin Panel
                        </button>
                      </div>
                      <AspirantDashboard />
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <Navigate to="/auth" replace />
          )
        } />
        
        <Route path="/payment/success/:sessionId" element={
          user ? (<PaymentSuccessPage />) : (<Navigate to="/auth" replace />)
        } />
        <Route path="/withdrawals" element={
          user ? (<WithdrawalsPage />) : (<Navigate to="/auth" replace />)
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

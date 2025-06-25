
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import AspirantDashboard from "@/components/dashboard/AspirantDashboard";
import Navigation from "@/components/Navigation";
import HomePage from "@/pages/HomePage";
import TalentsPage from "@/pages/TalentsPage";
import ProfileSettingsPage from "@/pages/ProfileSettingsPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "./pages/NotFound";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  console.log('App state:', { user: !!user, profile, loading });

  // Add timeout fallback for loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, app may be stuck');
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <LoadingSpinner 
          message="Connecting to UNIOSUN Connect..." 
          size="lg"
        />
      </div>
    );
  }

  return (
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
      
      <Route path="/auth" element={
        user ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <AuthForm />
        )
      } />

      {/* Standalone Admin Route */}
      <Route path="/admin" element={<AdminPage />} />

      <Route path="/profile-settings" element={
        user ? (
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <ProfileSettingsPage />
          </div>
        ) : (
          <Navigate to="/auth" replace />
        )
      } />
      
      <Route path="/dashboard" element={
        user ? (
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            {!profile ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8">
                  <h2 className="text-xl font-semibold mb-4">Setting up your profile...</h2>
                  <p className="text-gray-600 mb-4">This may take a moment for new accounts.</p>
                  <LoadingSpinner message="Loading your profile..." />
                </div>
              </div>
            ) : (
              <>
                {profile.role === 'student' && <StudentDashboard />}
                {profile.role === 'aspirant' && <AspirantDashboard />}
                {profile.role === 'admin' && (
                  <div className="container mx-auto px-4 py-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                      <h2 className="text-xl font-semibold text-blue-800 mb-2">Admin Access Available</h2>
                      <p className="text-blue-700 mb-4">You have administrator privileges. Access the admin panel for advanced features.</p>
                      <button 
                        onClick={() => window.location.href = '/admin'}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
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
      
      <Route path="*" element={<NotFound />} />
    </Routes>
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

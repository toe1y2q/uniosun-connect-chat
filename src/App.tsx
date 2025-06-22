
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import AspirantDashboard from "@/components/dashboard/AspirantDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import Navigation from "@/components/Navigation";
import HomePage from "@/pages/HomePage";
import TalentsPage from "@/pages/TalentsPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useState } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  console.log('App state:', { user: !!user, profile, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading UNIOSUN Connect...</p>
        </div>
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
      
      <Route path="/dashboard" element={
        user ? (
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            {!profile ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your profile...</p>
                </div>
              </div>
            ) : (
              <>
                {profile.role === 'admin' && <AdminDashboard />}
                {profile.role === 'student' && <StudentDashboard />}
                {profile.role === 'aspirant' && <AspirantDashboard />}
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

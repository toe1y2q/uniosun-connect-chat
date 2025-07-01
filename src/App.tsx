
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthContext";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import TalentsPage from "./pages/TalentsPage";
import QuizPage from "./pages/QuizPage";
import AdminPage from "./pages/AdminPage";
import UserManagementPage from "./pages/UserManagementPage";
import WithdrawalManagementPage from "./pages/WithdrawalManagementPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/talents" element={<TalentsPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/withdrawals" element={<WithdrawalManagementPage />} />
              <Route path="/auth" element={<Index />} />
              <Route path="/profile-settings" element={<ProfileSettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

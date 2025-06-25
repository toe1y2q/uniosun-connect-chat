
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import Navigation from '@/components/Navigation';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import LoadingSpinner from '@/components/ui/loading-spinner';

const AdminPage = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <LoadingSpinner message="Loading admin panel..." size="lg" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if not admin
  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <AdminDashboard />
    </div>
  );
};

export default AdminPage;

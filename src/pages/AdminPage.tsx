
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-red-800 mb-2">Admin Control Panel</h1>
          <p className="text-gray-600">Manage UNIOSUN Connect Platform</p>
        </div>
        <AdminDashboard />
      </div>
    </div>
  );
};

export default AdminPage;

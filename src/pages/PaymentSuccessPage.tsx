import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import Navigation from '@/components/Navigation';

const formatAmount = (kobo: number | null) => {
  if (!kobo && kobo !== 0) return '₦0';
  return `₦${(kobo / 100).toLocaleString()}`;
};

const PaymentSuccessPage: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Payment Receipt • Hireveno';
  }, []);

  const { data: session, isLoading } = useQuery({
    queryKey: ['payment-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: paymentTx } = useQuery({
    queryKey: ['payment-tx', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('type', 'payment')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <LoadingSpinner message="Preparing your receipt..." />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">We couldn't find this payment. Please check your dashboard.</p>
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Payment Receipt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-semibold">{formatAmount(session.amount)}</p>
                <p className="text-sm text-gray-600">{session.duration} minute tutoring session</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span>Session ID:</span>
                  <span className="font-medium truncate">{session.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-medium truncate">{paymentTx?.reference || session.flutterwave_reference || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled:</span>
                  <span className="font-medium">{new Date(session.scheduled_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium capitalize">{session.payment_status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-medium">{new Date(session.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Description:</span>
                  <span className="font-medium">{session.description}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => window.print()} className="flex-1">Print Receipt</Button>
                <Link to={`/chat/${session.id}`} className="flex-1">
                  <Button className="w-full">Go to Chat</Button>
                </Link>
              </div>

              <div className="text-center">
                <Link to="/dashboard">
                  <Button variant="ghost">Back to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccessPage;

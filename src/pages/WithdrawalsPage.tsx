import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import WalletSection from '@/components/wallet/WalletSection';

const WithdrawalsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Withdrawal Status • Hireveno';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold mb-4">Withdrawal Status</h1>
          <p className="text-sm text-gray-600 mb-6">Track your withdrawal requests and their current status.</p>
          <WalletSection />
        </div>
      </main>
    </div>
  );
};

export default WithdrawalsPage;

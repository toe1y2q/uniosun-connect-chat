
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, TrendingUp, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const WalletSection = () => {
  const { profile } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ['wallet', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', profile.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const balance = wallet?.balance ? wallet.balance / 100 : 0;

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available for withdrawal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦0</div>
            <p className="text-xs text-muted-foreground">
              Earnings this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦0</div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Withdraw Funds
          </CardTitle>
          <CardDescription>
            Withdraw your earnings to your bank account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">How withdrawals work:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Minimum withdrawal amount: ₦1,000</li>
                <li>• Processing time: 1-3 business days</li>
                <li>• No withdrawal fees</li>
              </ul>
            </div>
            
            <Button 
              disabled={balance < 1000}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {balance < 1000 ? 'Minimum ₦1,000 required' : 'Withdraw Funds'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest earnings and withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions?.length ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'earning' ? 'bg-green-100' :
                      transaction.type === 'withdrawal' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {transaction.type === 'earning' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : transaction.type === 'withdrawal' ? (
                        <ArrowDownRight className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Wallet className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{transaction.type}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {transaction.type === 'withdrawal' ? '-' : '+'}₦{(transaction.amount / 100).toLocaleString()}
                    </p>
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-gray-600">Complete sessions to start earning!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletSection;

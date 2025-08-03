
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, TrendingUp, Download, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const WalletSection = () => {
  const { profile, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bank_name: profile?.bank_name || '',
    bank_code: profile?.bank_code || '',
    account_number: profile?.account_number || '',
    account_name: profile?.account_name || ''
  });

  const { data: transactions, isLoading } = useQuery({
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

  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const saveBankInfoMutation = useMutation({
    mutationFn: async (bankData: typeof bankInfo) => {
      await updateProfile(bankData);
    },
    onSuccess: () => {
      toast.success('Bank information saved successfully');
      setShowBankForm(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      console.error('Error saving bank info:', error);
      toast.error('Failed to save bank information');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!profile?.id || !profile.account_number) {
        throw new Error('Bank information required');
      }

      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: profile.id,
          amount: amount * 100, // Convert to kobo
          bank_code: profile.bank_code!,
          account_number: profile.account_number,
          account_name: profile.account_name!,
          status: 'requested'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => {
      console.error('Error requesting withdrawal:', error);
      toast.error('Failed to request withdrawal');
    }
  });

  // Calculate actual available balance from transactions
  const totalEarnings = transactions?.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalWithdrawn = withdrawals?.filter(w => w.status !== 'cancelled' && w.status !== 'rejected').reduce((sum, w) => sum + w.amount, 0) || 0;
  const availableBalance = (totalEarnings - totalWithdrawn) / 100;
  
  const profileBalance = profile?.wallet_balance ? profile.wallet_balance / 100 : 0;
  const hasEarnings = transactions?.some(t => t.type === 'earning') || false;
  const hasBankInfo = profile?.account_number && profile?.bank_code && profile?.account_name;

  const handleSaveBankInfo = () => {
    if (!bankInfo.bank_name || !bankInfo.bank_code || !bankInfo.account_number || !bankInfo.account_name) {
      toast.error('Please fill in all bank information fields');
      return;
    }
    saveBankInfoMutation.mutate(bankInfo);
  };

  const handleWithdraw = () => {
    if (!hasBankInfo) {
      toast.error('Please add your bank information first');
      setShowBankForm(true);
      return;
    }
    
    if (availableBalance < 5) {
      toast.error('Minimum withdrawal amount is ₦500');
      return;
    }

    withdrawMutation.mutate(availableBalance);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

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
            <div className="text-2xl font-bold">₦{availableBalance.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">₦{(totalEarnings / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bank Information
          </CardTitle>
          <CardDescription>
            Add your bank details to receive automatic withdrawals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasBankInfo || showBankForm ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={bankInfo.bank_name}
                  onChange={(e) => setBankInfo({...bankInfo, bank_name: e.target.value})}
                  placeholder="e.g., Access Bank, GTBank"
                />
              </div>
              <div>
                <Label htmlFor="bank_code">Bank Code</Label>
                <Input
                  id="bank_code"
                  value={bankInfo.bank_code}
                  onChange={(e) => setBankInfo({...bankInfo, bank_code: e.target.value})}
                  placeholder="e.g., 044, 058"
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={bankInfo.account_number}
                  onChange={(e) => setBankInfo({...bankInfo, account_number: e.target.value})}
                  placeholder="10-digit account number"
                />
              </div>
              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={bankInfo.account_name}
                  onChange={(e) => setBankInfo({...bankInfo, account_name: e.target.value})}
                  placeholder="Account holder name"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveBankInfo}
                  disabled={saveBankInfoMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saveBankInfoMutation.isPending ? 'Saving...' : 'Save Bank Info'}
                </Button>
                {hasBankInfo && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBankForm(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p><strong>Bank:</strong> {profile.bank_name}</p>
              <p><strong>Account:</strong> {profile.account_number}</p>
              <p><strong>Name:</strong> {profile.account_name}</p>
              <Button 
                variant="outline" 
                onClick={() => setShowBankForm(true)}
                size="sm"
              >
                Edit Bank Info
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                <li>• Minimum withdrawal amount: ₦500</li>
                <li>• Processing time: 1-3 business days</li>
                <li>• No withdrawal fees</li>
                <li>• Automatic transfer to your bank account</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleWithdraw}
              disabled={availableBalance < 5 || !hasBankInfo || withdrawMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {withdrawMutation.isPending ? 'Processing...' :
               availableBalance < 5 ? 'Minimum ₦500 required' :
               !hasBankInfo ? 'Add bank info first' :
               `Withdraw ₦${availableBalance.toLocaleString()}`}
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

      {/* Withdrawal History */}
      {withdrawals?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
            <CardDescription>Track your withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Download className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Withdrawal to {withdrawal.bank_code}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{(withdrawal.amount / 100).toLocaleString()}</p>
                    <Badge 
                      variant={withdrawal.status === 'paid' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {withdrawal.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default WalletSection;

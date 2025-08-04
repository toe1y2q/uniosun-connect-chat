
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { 
  Wallet, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  DollarSign, 
  CreditCard,
  History,
  TrendingUp
} from 'lucide-react';

const AspirantWallet = () => {
  const { profile } = useAuth();
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch wallet balance and transactions
  const { data: transactions } = useQuery({
    queryKey: ['aspirant-transactions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch sessions for spending history
  const { data: sessions } = useQuery({
    queryKey: ['aspirant-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:users!sessions_student_id_fkey (name)
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Flutterwave configuration for deposits
  const config = {
    public_key: 'FLWPUBK-08518f8d77cbc2a7fbdd880c432bd85f-X',
    tx_ref: `deposit_${Date.now()}_${profile?.id}`,
    amount: parseFloat(depositAmount) || 0,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: profile?.email || '',
      phone_number: '',
      name: profile?.name || '',
    },
    customizations: {
      title: 'Wallet Deposit',
      description: `Deposit ₦${depositAmount} to your wallet`,
      logo: '/lovable-uploads/f8c01903-66a0-4f99-82df-b1a9d9aeac4b.png',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount (minimum ₦100)",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(depositAmount) < 100) {
      toast({
        title: "Amount Too Small",
        description: "Minimum deposit amount is ₦100",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    handleFlutterPayment({
      callback: async (response) => {
        console.log('Deposit payment response:', response);
        
        // Check for successful payment - Flutterwave returns different status formats
        const isSuccessful = response.status === 'successful' || 
                           response.status === 'completed' ||
                           (response as any)?.data?.status === 'successful';
        
        if (isSuccessful) {
          try {
            const amount = Math.round(parseFloat(depositAmount) * 100); // Convert to kobo

            // Create transaction record
            const { error } = await supabase
              .from('transactions')
              .insert({
                user_id: profile!.id,
                type: 'payment',
                amount: amount,
                status: 'completed',
                description: `Wallet deposit of ₦${depositAmount}`,
                reference: response.flw_ref
              });

            if (error) throw error;

            // Update wallet balance
            const { error: walletError } = await supabase
              .from('users')
              .update({
                wallet_balance: (profile?.wallet_balance || 0) + amount
              })
              .eq('id', profile!.id);

            if (walletError) throw walletError;

            toast({
              title: "Deposit Successful",
              description: `₦${depositAmount} has been added to your wallet`
            });

            setDepositAmount('');
            // Refresh page to update wallet balance
            window.location.reload();
          } catch (error) {
            console.error('Deposit processing error:', error);
            toast({
              title: "Deposit Failed",
              description: "There was an error processing your deposit. Please contact support.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Payment Failed",
            description: "Payment failed or was cancelled",
            variant: "destructive"
          });
        }
        
        closePaymentModal();
        setIsProcessing(false);
      },
      onClose: () => {
        console.log('Payment modal closed');
        setIsProcessing(false);
      },
    });
  };

  const walletBalance = (profile?.wallet_balance || 0) / 100;
  const totalSpent = sessions?.reduce((sum, session) => sum + (session.amount || 0), 0) || 0;
  const totalDeposits = transactions?.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{walletBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available for bookings
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₦{(totalSpent / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              On tutoring sessions
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{(totalDeposits / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time deposits
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deposit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-green-100">
          <TabsTrigger value="deposit" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Plus className="w-4 h-4 mr-2" />
            Deposit
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-4">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CreditCard className="w-5 h-5" />
                Add Money to Wallet
              </CardTitle>
              <CardDescription>
                Fund your wallet to book tutoring sessions with verified students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="100"
                  step="100"
                />
                <p className="text-sm text-gray-500">Minimum deposit: ₦100</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[500, 1000, 2000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(amount.toString())}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    ₦{amount}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleDeposit}
                disabled={isProcessing || !depositAmount}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Deposit ₦{depositAmount || '0'}
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-gray-500">
                <p>Secure payment powered by Flutterwave</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Transaction History</CardTitle>
              <CardDescription>Your recent wallet transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'payment' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'payment' ? 
                            <ArrowDownLeft className="w-4 h-4 text-green-600" /> :
                            <ArrowUpRight className="w-4 h-4 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'payment' ? '+' : '-'}₦{(transaction.amount / 100).toLocaleString()}
                        </p>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' : 
                          transaction.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {transaction.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                  <p className="text-gray-600">Your transaction history will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Spending Analytics</CardTitle>
              <CardDescription>Insights into your tutoring expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">This Month</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sessions Booked</span>
                      <span className="font-medium">{sessions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount Spent</span>
                      <span className="font-medium">₦{(totalSpent / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg. Session Cost</span>
                      <span className="font-medium">
                        ₦{sessions?.length ? ((totalSpent / sessions.length) / 100).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Popular Subjects</h4>
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-600">Subject analytics coming soon</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AspirantWallet;

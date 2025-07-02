
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, CreditCard, Check } from 'lucide-react';

interface PaymentSelectorProps {
  selectedMethod: 'wallet' | 'flutterwave';
  onMethodChange: (method: 'wallet' | 'flutterwave') => void;
  walletBalance: number;
  sessionAmount: number;
}

const PaymentSelector = ({ 
  selectedMethod, 
  onMethodChange, 
  walletBalance, 
  sessionAmount 
}: PaymentSelectorProps) => {
  const hasEnoughBalance = walletBalance >= sessionAmount;

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Payment Method</h3>
      
      {/* Wallet Option */}
      <Card 
        className={`cursor-pointer transition-all ${
          selectedMethod === 'wallet' 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 hover:border-green-300'
        }`}
        onClick={() => hasEnoughBalance && onMethodChange('wallet')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                selectedMethod === 'wallet' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Wallet className={`w-5 h-5 ${
                  selectedMethod === 'wallet' ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <div className="font-medium">Wallet Balance</div>
                <div className="text-sm text-gray-600">
                  ₦{walletBalance.toLocaleString()} available
                </div>
                {!hasEnoughBalance && (
                  <div className="text-xs text-red-600 mt-1">
                    Insufficient balance
                  </div>
                )}
              </div>
            </div>
            {selectedMethod === 'wallet' && hasEnoughBalance && (
              <Check className="w-5 h-5 text-green-600" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flutterwave Option */}
      <Card 
        className={`cursor-pointer transition-all ${
          selectedMethod === 'flutterwave' 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 hover:border-green-300'
        }`}
        onClick={() => onMethodChange('flutterwave')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                selectedMethod === 'flutterwave' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <CreditCard className={`w-5 h-5 ${
                  selectedMethod === 'flutterwave' ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <div className="font-medium">Card Payment</div>
                <div className="text-sm text-gray-600">
                  Pay with card via Flutterwave
                </div>
              </div>
            </div>
            {selectedMethod === 'flutterwave' && (
              <Check className="w-5 h-5 text-green-600" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSelector;

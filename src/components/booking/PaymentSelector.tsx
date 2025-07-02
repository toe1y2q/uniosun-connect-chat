import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, CreditCard } from 'lucide-react';

interface PaymentSelectorProps {
  walletBalance: number;
  sessionAmount: number;
  onWalletPayment: () => void;
  onFlutterwavePayment: () => void;
  isProcessing: boolean;
}

const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  walletBalance,
  sessionAmount,
  onWalletPayment,
  onFlutterwavePayment,
  isProcessing
}) => {
  const canPayWithWallet = walletBalance >= sessionAmount;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 mb-3">Choose Payment Method</h3>
      
      {/* Wallet Payment Option */}
      <Card className={`border-2 transition-colors ${canPayWithWallet ? 'border-green-200 hover:border-green-300' : 'border-gray-200 opacity-60'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${canPayWithWallet ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Wallet className={`w-5 h-5 ${canPayWithWallet ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`font-medium ${canPayWithWallet ? 'text-gray-900' : 'text-gray-500'}`}>
                  Pay from Wallet
                </p>
                <p className={`text-sm ${canPayWithWallet ? 'text-gray-600' : 'text-gray-400'}`}>
                  Balance: ₦{(walletBalance / 100).toLocaleString()}
                </p>
              </div>
            </div>
            {canPayWithWallet && (
              <Button
                onClick={onWalletPayment}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-sm px-4 py-2"
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </Button>
            )}
          </div>
          {!canPayWithWallet && (
            <p className="text-xs text-red-600">
              Insufficient wallet balance (Need ₦{((sessionAmount - walletBalance) / 100).toLocaleString()} more)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Flutterwave Payment Option */}
      <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Pay with Card/Bank</p>
                <p className="text-sm text-gray-600">Secure payment via Flutterwave</p>
              </div>
            </div>
            <Button
              onClick={onFlutterwavePayment}
              disabled={isProcessing}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 text-sm px-4 py-2"
            >
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="flex justify-between items-center text-gray-600">
          <span>Session Amount:</span>
          <span className="font-medium">₦{(sessionAmount / 100).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSelector;
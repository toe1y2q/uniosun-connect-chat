
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, CreditCard } from 'lucide-react';

interface PaymentSelectorProps {
  amount: number;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  amount,
  onPaymentSuccess,
  onCancel
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 mb-3">Choose Payment Method</h3>
      
      {/* Card Payment Option */}
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
              onClick={onPaymentSuccess}
              className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2"
            >
              Pay ₦{amount}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="flex justify-between items-center text-gray-600">
          <span>Session Amount:</span>
          <span className="font-medium">₦{amount}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default PaymentSelector;

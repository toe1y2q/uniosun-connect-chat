import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, MessageCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface CongratulationsPageProps {
  sessionData: any;
  onProceedToChat: () => void;
  onGenerateReceipt: () => void;
  onClose: () => void;
}

const CongratulationsPage: React.FC<CongratulationsPageProps> = ({
  sessionData,
  onProceedToChat,
  onGenerateReceipt,
  onClose
}) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Congratulations! 🎉
        </h2>
        <p className="text-gray-600 text-lg">
          You've taken your first step to success!
        </p>
      </motion.div>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-center text-green-800">
            Session Booked Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              Your tutoring session with <strong>{sessionData?.student?.name}</strong> has been confirmed.
              Get ready to learn and excel!
            </p>
            
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{sessionData?.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-green-600">₦{(sessionData?.amount / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scheduled:</span>
                <span className="font-medium">{new Date(sessionData?.scheduled_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={onGenerateReceipt}
          variant="outline"
          className="border-green-200 text-green-600 hover:bg-green-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Generate Receipt
        </Button>
        <Button
          onClick={onProceedToChat}
          className="bg-green-600 hover:bg-green-700"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Proceed to Chat
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          💡 <strong>Pro Tip:</strong> Don't forget to rate and review your tutor after the session to help other aspirants!
        </p>
        <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700">
          Close
        </Button>
      </div>
    </div>
  );
};

export default CongratulationsPage;
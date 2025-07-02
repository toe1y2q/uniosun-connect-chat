import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface InstallPromptProps {
  onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onDismiss }) => {
  const { isInstallable, installApp } = usePWA();

  if (!isInstallable) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-green-200 bg-green-50 md:left-auto md:right-4 md:max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-green-800 mb-1">Install Hireveno App</h3>
            <p className="text-sm text-green-700 mb-3">
              Add Hireveno to your home screen for quick access and better experience.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={installApp}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-1" />
                Install
              </Button>
              <Button 
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="text-green-600"
              >
                Maybe Later
              </Button>
            </div>
          </div>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-green-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
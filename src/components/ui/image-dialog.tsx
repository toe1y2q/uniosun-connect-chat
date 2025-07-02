import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc?: string;
  imageAlt?: string;
  fallbackText?: string;
}

const ImageDialog: React.FC<ImageDialogProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  fallbackText
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-4">
        <DialogTitle className="sr-only">Profile Image</DialogTitle>
        <div className="flex justify-center">
          <Avatar className="w-80 h-80 md:w-96 md:h-96">
            <AvatarImage 
              src={imageSrc} 
              alt={imageAlt || 'Profile image'}
              className="object-cover"
            />
            <AvatarFallback className="text-6xl md:text-8xl bg-primary/10 text-primary">
              {fallbackText || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageDialog;
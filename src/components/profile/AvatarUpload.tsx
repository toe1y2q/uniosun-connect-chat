
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
}

const AvatarUpload = ({ size = 'md', showUploadButton = true }: AvatarUploadProps) => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24'
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update the user's profile with the new avatar URL
      await updateProfile({ profile_image: publicUrl });
      
      toast({
        title: "Avatar updated successfully!",
        description: "Your profile picture has been updated."
      });
      
      // Force a page refresh to show the new avatar immediately
      window.location.reload();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage 
            src={profile?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`} 
            alt={profile?.name || 'User'} 
          />
          <AvatarFallback>
            {profile?.name ? getInitials(profile.name) : 'U'}
          </AvatarFallback>
        </Avatar>
        
        {showUploadButton && (
          <label 
            htmlFor="avatar-upload" 
            className="absolute -bottom-1 -right-1 p-1 bg-green-600 text-white rounded-full cursor-pointer hover:bg-green-700 transition-colors"
          >
            <Camera className="w-3 h-3" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      
      {showUploadButton && size === 'lg' && (
        <div>
          <label htmlFor="avatar-upload-button">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={uploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Change Avatar'}
              </span>
            </Button>
            <input
              id="avatar-upload-button"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ size = 'lg', showUploadButton = true }) => {
  const { user, profile, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading avatar to path:', filePath);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Avatar uploaded successfully. Public URL:', urlData.publicUrl);

      // Update user profile with new avatar URL
      await updateProfile({
        profile_image: urlData.publicUrl
      });

      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'md':
        return 'w-16 h-16';
      case 'lg':
      default:
        return 'w-24 h-24';
    }
  };

  const getCameraIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'md':
        return 'w-3 h-3';
      case 'lg':
      default:
        return 'w-4 h-4';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className={`${getSizeClasses()} border-4 border-green-200`}>
          <AvatarImage 
            src={profile?.profile_image} 
            alt={profile?.name || 'User avatar'}
            key={profile?.profile_image} // Force re-render when URL changes
          />
          <AvatarFallback className="bg-green-100 text-green-600 text-xl">
            {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        {showUploadButton && (
          <div className="absolute -bottom-2 -right-2">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg transition-colors">
                <Camera className={getCameraIconSize()} />
              </div>
            </label>
          </div>
        )}
      </div>

      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
        className="hidden"
      />

      {showUploadButton && (
        <Button
          onClick={() => document.getElementById('avatar-upload')?.click()}
          disabled={uploading}
          variant="outline"
          className="border-green-200 text-green-600 hover:bg-green-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </Button>
      )}
    </div>
  );
};

export default AvatarUpload;

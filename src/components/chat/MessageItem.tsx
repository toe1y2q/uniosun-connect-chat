
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Reply, Trash2, Flag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  replied_to?: string;
  is_flagged?: boolean;
  is_flagged_content?: boolean;
}

interface User {
  id: string;
  name: string;
  profile_image?: string;
}

interface MessageItemProps {
  message: Message;
  sender?: User;
  isCurrentUser: boolean;
  replyingToMessage?: Message;
  replyingToSender?: User;
  onReply: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  sender,
  isCurrentUser,
  replyingToMessage,
  replyingToSender,
  onReply,
  onDelete
}) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMessage = async () => {
    if (!isCurrentUser) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ 
          message: '[Message deleted]',
          is_flagged: true 
        })
        .eq('id', message.id);

      if (error) throw error;
      
      toast.success('Message deleted');
      onDelete(message.id);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFlagMessage = async () => {
    if (isCurrentUser) return;
    
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          message_id: message.id,
          flagged_by: user?.id,
          reason: 'Inappropriate content'
        });

      if (error) throw error;
      
      toast.success('Message flagged for review');
    } catch (error) {
      console.error('Error flagging message:', error);
      toast.error('Failed to flag message');
    }
  };

  if (message.is_flagged && message.message === '[Message deleted]') {
    return (
      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className="max-w-xs lg:max-w-md">
          <div className="p-3 rounded-lg bg-gray-100 border border-gray-200">
            <p className="text-sm text-gray-500 italic">[Message deleted]</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(message.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-xs lg:max-w-md flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isCurrentUser && sender && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={sender.profile_image} />
            <AvatarFallback>
              {sender.name?.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1">
          {replyingToMessage && (
            <div className="mb-2 p-2 bg-gray-50 rounded text-xs border-l-2 border-green-500">
              <p className="font-medium text-gray-600">
                Replying to {replyingToSender?.name}:
              </p>
              <p className="text-gray-700 truncate">{replyingToMessage.message}</p>
            </div>
          )}
          
          <div
            className={`p-3 rounded-lg ${
              isCurrentUser
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200'
            }`}
          >
            <p className="text-sm">{message.message}</p>
            <div className="flex items-center justify-between mt-1">
              <p className={`text-xs ${isCurrentUser ? 'text-green-100' : 'text-gray-500'}`}>
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onReply(message.id)}>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    {isCurrentUser && (
                      <DropdownMenuItem 
                        onClick={handleDeleteMessage}
                        disabled={isDeleting}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                    {!isCurrentUser && (
                      <DropdownMenuItem 
                        onClick={handleFlagMessage}
                        className="text-red-600"
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Flag
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;


-- Add replied_to column to chat_messages table for reply functionality
ALTER TABLE public.chat_messages 
ADD COLUMN replied_to UUID REFERENCES public.chat_messages(id);

-- Add index for better performance on replied_to queries
CREATE INDEX idx_chat_messages_replied_to ON public.chat_messages(replied_to);

-- Add RLS policy for message deletion (users can delete their own messages)
CREATE POLICY "Users can delete their own messages" 
  ON public.chat_messages 
  FOR DELETE 
  USING (sender_id = auth.uid());

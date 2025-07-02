
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';
import { MessageSquare, Send } from 'lucide-react';

const AppealsForm = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    description: ''
  });

  const createAppealMutation = useMutation({
    mutationFn: async (appealData: any) => {
      const { error } = await supabase
        .from('appeals')
        .insert({
          ...appealData,
          user_id: profile?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Appeal Submitted",
        description: "Your appeal has been submitted successfully. We'll review it and get back to you.",
      });
      setFormData({ type: '', subject: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['user-appeals'] });
    },
    onError: (error) => {
      console.error('Appeal submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit appeal. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.subject || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to submit your appeal.",
        variant: "destructive"
      });
      return;
    }

    createAppealMutation.mutate(formData);
  };

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <MessageSquare className="w-5 h-5" />
          Submit an Appeal
        </CardTitle>
        <CardDescription>
          Need help? Submit an appeal and our admin team will review it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Appeal Type</label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select appeal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account">Account Issues</SelectItem>
                <SelectItem value="payment">Payment Problems</SelectItem>
                <SelectItem value="session">Session Issues</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Subject</label>
            <Input
              placeholder="Brief description of your issue"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
            <Textarea
              placeholder="Provide detailed information about your issue..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={5}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={createAppealMutation.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            {createAppealMutation.isPending ? 'Submitting...' : 'Submit Appeal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AppealsForm;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { Loader2, Send } from "lucide-react";

interface GigApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  gig: {
    id: string;
    title: string;
    budget_min?: number;
    budget_max?: number;
    payment_type?: string;
  };
  onSuccess?: () => void;
}

const GigApplicationModal = ({ 
  isOpen, 
  onClose, 
  gig, 
  onSuccess 
}: GigApplicationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for gigs",
        variant: "destructive"
      });
      return;
    }

    if (!coverLetter.trim()) {
      toast({
        title: "Cover Letter Required",
        description: "Please write a brief cover letter explaining why you're a good fit",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('gig_applications')
        .insert({
          gig_id: gig.id,
          student_id: user.id,
          cover_letter: coverLetter.trim(),
          proposed_amount: proposedAmount ? parseInt(proposedAmount) : null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Applied",
            description: "You have already applied to this gig",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Application Submitted!",
        description: "Your application has been sent to the employer",
      });

      setCoverLetter('');
      setProposedAmount('');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply to Gig</DialogTitle>
          <DialogDescription>
            {gig.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cover-letter">
              Cover Letter <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cover-letter"
              placeholder="Introduce yourself and explain why you're the right person for this gig. Highlight relevant experience or skills..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Be specific about your experience and how you can help
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposed-amount">
              Your Proposed Amount (₦)
              {gig.budget_min && gig.budget_max && (
                <span className="text-muted-foreground font-normal ml-2">
                  Budget: ₦{gig.budget_min.toLocaleString()} - ₦{gig.budget_max.toLocaleString()}
                  {gig.payment_type === 'hourly' && '/hr'}
                </span>
              )}
            </Label>
            <Input
              id="proposed-amount"
              type="number"
              placeholder="Enter your proposed amount"
              value={proposedAmount}
              onChange={(e) => setProposedAmount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GigApplicationModal;

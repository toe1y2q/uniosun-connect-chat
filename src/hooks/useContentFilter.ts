
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RestrictedKeyword {
  id: string;
  keyword: string;
  category: string;
}

export const useContentFilter = () => {
  const [restrictedKeywords, setRestrictedKeywords] = useState<RestrictedKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestrictedKeywords = async () => {
      try {
        const { data, error } = await supabase
          .from('restricted_content')
          .select('*');
        
        if (error) throw error;
        setRestrictedKeywords(data || []);
      } catch (error) {
        console.error('Error fetching restricted keywords:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestrictedKeywords();
  }, []);

  const isMessageAllowed = (message: string): { allowed: boolean; reason?: string } => {
    const lowerMessage = message.toLowerCase();
    
    // Check if message contains academic/university-related keywords
    const hasAcademicContent = restrictedKeywords.some(keyword => 
      lowerMessage.includes(keyword.keyword.toLowerCase())
    );

    if (!hasAcademicContent) {
      return {
        allowed: false,
        reason: 'Messages must be related to academics, admission, departments, university, or other universities.'
      };
    }

    // Check for inappropriate content patterns
    const inappropriatePatterns = [
      /dating|romance|relationship/i,
      /money.*transfer|send.*money/i,
      /personal.*contact|phone.*number|whatsapp/i,
      /meet.*outside|meet.*person/i
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(message)) {
        return {
          allowed: false,
          reason: 'Message contains inappropriate content. Please keep discussions academic.'
        };
      }
    }

    return { allowed: true };
  };

  return {
    isMessageAllowed,
    restrictedKeywords,
    isLoading
  };
};

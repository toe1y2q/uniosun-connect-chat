
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, GraduationCap, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import BookingModal from '@/components/booking/BookingModal';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
  department_id: string | null;
  departments: {
    name: string;
  } | null;
}

interface TalentsPageProps {
  onAuthRequired?: () => void;
}

const TalentsPage = ({ onAuthRequired }: TalentsPageProps) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: talents, isLoading } = useQuery({
    queryKey: ['verified-talents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name)
        `)
        .eq('role', 'student')
        .eq('is_verified', true)
        .eq('badge', true)
        .order('name');
      
      if (error) throw error;
      return data as Student[];
    }
  });

  const handleBooking = (student: Student) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }
    setSelectedStudent(student);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading talented students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={handleGoBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              UNIOSUN Connect Talents
            </h1>
            <p className="text-gray-600">
              Connect with verified students who have proven their expertise
            </p>
          </div>
        </div>

        {talents && talents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-green-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar className="w-20 h-20 border-4 border-green-200">
                        <AvatarImage 
                          src={student.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
                          alt={student.name}
                        />
                        <AvatarFallback className="bg-green-100 text-green-600 text-lg">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-xl text-green-800">{student.name}</CardTitle>
                    <CardDescription className="flex items-center justify-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      {student.departments?.name || 'Department not specified'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="flex justify-center">
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <Star className="w-3 h-3 mr-1" />
                        Verified Talent
                      </Badge>
                    </div>
                    <Button 
                      onClick={() => handleBooking(student)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Book Session
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <GraduationCap className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Talents Available Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We're working on verifying more talented students. Check back soon to discover amazing students ready to help!
            </p>
          </div>
        )}

        {selectedStudent && (
          <BookingModal
            student={selectedStudent}
            isOpen={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </div>
    </div>
  );
};

export default TalentsPage;

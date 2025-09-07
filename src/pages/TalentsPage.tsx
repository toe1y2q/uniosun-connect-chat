
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Star, MapPin, Calendar, BookOpen, GraduationCap, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BookingModal from '@/components/booking/BookingModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface TalentsPageProps {
  onAuthRequired?: () => void;
}

const TalentsPage: React.FC<TalentsPageProps> = ({ onAuthRequired }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const navigate = useNavigate();

  // Fetch verified students via safe public view + map department names client-side
  const { data: talents, isLoading } = useQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const [studentsRes, departmentsRes] = await Promise.all([
        supabase
          .from('verified_students_public')
          .select('*')
          .order('quiz_score', { ascending: false }),
        supabase
          .from('departments')
          .select('id, name')
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (departmentsRes.error) throw departmentsRes.error;

      const deptMap = new Map((departmentsRes.data || []).map((d: any) => [d.id, d.name]));

      return (studentsRes.data || []).map((s: any) => ({
        ...s,
        departments: { name: deptMap.get(s.department_id) || 'General Studies' },
      }));
    }
  });

  const filteredTalents = talents?.filter(talent =>
    talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    talent.departments?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBookSession = (student: any) => {
    setSelectedStudent(student);
    setShowBookingModal(true);
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleBookingSuccess = () => {
    toast.success('Session booked successfully!');
    // Optionally refresh talents data or navigate
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
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Our <span className="text-green-600">Talented Students</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with verified university students who have proven their expertise. 
              Book personalized sessions to get help with your academic journey.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 focus:border-green-400"
            />
          </div>
        </motion.div>

        {/* Talents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalents?.map((talent, index) => (
            <motion.div
              key={talent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-green-200 hover:shadow-lg transition-all duration-300 hover:border-green-300">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="w-20 h-20 border-4 border-green-200">
                      <AvatarImage src={talent.profile_image} />
                      <AvatarFallback className="bg-green-100 text-green-600 text-xl">
                        {talent.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-xl text-gray-900">{talent.name}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {talent.departments?.name || 'General Studies'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">Quiz Score</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{talent.quiz_score || 0}%</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <GraduationCap className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">Verified</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Talent
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => navigate(`/student/${talent.id}`)}
                      variant="outline"
                      className="w-full border-green-200 text-green-600 hover:bg-green-50"
                    >
                      View Profile
                    </Button>
                    <Button
                      onClick={() => handleBookSession(talent)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Book Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTalents?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? 'No talents found' : 'No talents available yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Students are working hard to earn their talent badges!'
              }
            </p>
          </motion.div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedStudent && (
        <BookingModal
          student={selectedStudent}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedStudent(null);
          }}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default TalentsPage;

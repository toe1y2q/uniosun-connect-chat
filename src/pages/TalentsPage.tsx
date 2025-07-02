
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Star, MapPin, Calendar, BookOpen, GraduationCap, MessageCircle, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BookingModal from '@/components/booking/BookingModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';

interface TalentsPageProps {
  onAuthRequired?: () => void;
}

const TalentsPage: React.FC<TalentsPageProps> = ({ onAuthRequired }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Fetch verified students with their department info
  const { data: talents, isLoading } = useQuery({
    queryKey: ['talents'],
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
        .order('quiz_score', { ascending: false });
      
      if (error) throw error;
      return data;
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

  const handleViewProfile = (studentId: string) => {
    navigate(`/student/${studentId}`);
  };

  const canBookSession = profile?.role === 'aspirant';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading talented students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Find Talents</h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
          
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Connect with verified UNIOSUN students
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 focus:border-green-400 h-12"
            />
          </div>
        </motion.div>

        {/* Talents Grid */}
        <div className="space-y-4">
          {filteredTalents?.map((talent, index) => (
            <motion.div
              key={talent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-green-200 hover:shadow-md transition-all duration-300 hover:border-green-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12 border-2 border-green-200">
                      <AvatarImage src={talent.profile_image} />
                      <AvatarFallback className="bg-green-100 text-green-600 text-sm">
                        {talent.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base truncate">{talent.name}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 truncate">{talent.departments?.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {talent.quiz_score ? `${talent.quiz_score}%` : 'Verified'}
                    </Badge>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="text-lg font-semibold text-green-600">₦1,000/hour</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleViewProfile(talent.id)}
                      variant="outline"
                      className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                    {canBookSession && (
                      <Button 
                        onClick={() => handleBookSession(talent)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Book
                      </Button>
                    )}
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
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'No talents found' : 'No talents available yet'}
            </h3>
            <p className="text-sm text-gray-500">
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
          onAuthRequired={onAuthRequired}
        />
      )}
    </div>
  );
};

export default TalentsPage;

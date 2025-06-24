
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Search, Star, MapPin, BookOpen, Calendar, Award, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '@/components/booking/BookingModal';

interface TalentsPageProps {
  onAuthRequired?: () => void;
}

const TalentsPage = ({ onAuthRequired }: TalentsPageProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { data: students, isLoading } = useQuery({
    queryKey: ['verified-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          department:departments(name)
        `)
        .eq('role', 'student')
        .eq('is_verified', true)
        .eq('badge', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || student.department_id === selectedDepartment;
    return matchesSearch && matchesDepartment;
  }) || [];

  const handleBookSession = (student: any) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }
    
    setSelectedStudent(student);
    setShowBookingModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading talented tutors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Go Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2 hover:bg-green-50 border-green-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Talented <span className="text-green-600">Tutors</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with verified UNIOSUN students who have proven their expertise through our rigorous quiz system. 
            Book personalized 1-on-1 sessions to excel in your studies.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-64">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found {filteredStudents.length} verified tutor{filteredStudents.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-semibold text-lg">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-100 text-green-800">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                        {student.quiz_score && (
                          <Badge variant="outline">
                            <Star className="w-3 h-3 mr-1" />
                            {student.quiz_score}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">{student.department?.name || 'Department not specified'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">UNIOSUN Student</span>
                </div>

                <CardDescription className="text-sm">
                  Experienced tutor specializing in {student.department?.name || 'various subjects'}. 
                  Passed our comprehensive knowledge assessment with {student.quiz_score || 'excellent'} score.
                </CardDescription>

                <div className="pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Session Rate</span>
                    <span className="font-semibold text-green-600">
                      ₦{profile?.role === 'aspirant' ? '1,000' : '1,500'}/hour
                    </span>
                  </div>
                  
                  <Button 
                    onClick={() => handleBookSession(student)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tutors found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm || selectedDepartment !== 'all' ? 
                'Try adjusting your search criteria to find more tutors.' :
                'No verified tutors are available at the moment. Check back later!'
              }
            </p>
          </div>
        )}

        {/* Booking Modal */}
        {selectedStudent && (
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedStudent(null);
            }}
            student={selectedStudent}
          />
        )}
      </div>
    </div>
  );
};

export default TalentsPage;

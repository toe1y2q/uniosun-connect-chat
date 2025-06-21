
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Star, Calendar, MessageSquare, GraduationCap, LogIn } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from '@/hooks/use-toast';

interface TalentsPageProps {
  onAuthRequired: () => void;
}

const TalentsPage: React.FC<TalentsPageProps> = ({ onAuthRequired }) => {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch departments
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

  // Fetch verified students (public access)
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['public-verified-students', selectedDepartment, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name)
        `)
        .eq('role', 'student')
        .eq('is_verified', true)
        .eq('badge', true);

      if (selectedDepartment) {
        query = query.eq('department_id', selectedDepartment);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleBookingAttempt = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a session with a student.",
        variant: "destructive"
      });
      onAuthRequired();
    } else {
      toast({
        title: "Booking Feature",
        description: "Booking functionality is coming soon!",
      });
    }
  };

  const handleChatAttempt = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to chat with students.",
        variant: "destructive"
      });
      onAuthRequired();
    } else {
      toast({
        title: "Chat Feature",
        description: "Chat functionality is coming soon!",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-800 rounded-xl flex items-center justify-center"
            >
              <GraduationCap className="w-9 h-9 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                UNIOSUN Talents
              </h1>
              <p className="text-gray-600 mt-2">Connect with Verified Students</p>
            </div>
          </div>
          
          {!user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <LogIn className="w-5 h-5 text-green-600" />
                <p className="text-green-800">
                  <strong>Sign in required:</strong> You can browse talents, but need to sign in to book sessions or chat.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Search and Filter */}
        <Card className="mb-8 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Search className="w-5 h-5" />
              Find Your Perfect Study Partner
            </CardTitle>
            <CardDescription>
              Search for verified UNIOSUN students by department or name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-green-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="w-64">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="border-green-200 focus:border-green-500">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="">All Departments</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingStudents ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border-green-200">
                <CardContent className="p-6">
                  <div className="h-24 bg-green-100 rounded mb-4"></div>
                  <div className="h-4 bg-green-100 rounded mb-2"></div>
                  <div className="h-4 bg-green-100 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))
          ) : students?.length ? (
            students.map((student) => (
              <motion.div
                key={student.id}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow border-green-200 hover:border-green-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16 border-2 border-green-200">
                        <AvatarImage src={student.profile_image} />
                        <AvatarFallback className="bg-green-100 text-green-700 text-lg font-semibold">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.departments?.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Verified Talent
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Quiz Score:</span>
                        <span className="font-semibold text-green-600">
                          {student.quiz_score || 'N/A'}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>4.8</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        onClick={handleBookingAttempt}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Session
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleChatAttempt}
                          variant="outline" 
                          className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        <Button variant="outline" size="sm" className="border-green-200 text-green-700">
                          ₦1,000 • 30min
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <GraduationCap className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No talents found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="text-center border-green-200">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {students?.length || 0}
              </div>
              <p className="text-gray-600">Verified Talents</p>
            </CardContent>
          </Card>
          <Card className="text-center border-green-200">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {departments?.length || 0}
              </div>
              <p className="text-gray-600">Departments</p>
            </CardContent>
          </Card>
          <Card className="text-center border-green-200">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                4.8
              </div>
              <p className="text-gray-600">Average Rating</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TalentsPage;

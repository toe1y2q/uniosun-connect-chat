
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from './AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, GraduationCap, Users, Mail, Lock, User, BookOpen, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthFormProps {
  onBack?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'aspirant' as 'student' | 'aspirant',
    jamb_reg: '',
    department_id: ''
  });

  const { signIn, signUp } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          name: formData.name,
          role: formData.role,
          jamb_reg: formData.role === 'student' ? formData.jamb_reg : undefined,
          department_id: formData.role === 'student' ? formData.department_id : undefined
        });
        if (error) throw error;
        
        toast({
          title: "Account created successfully!",
          description: formData.role === 'student' 
            ? "Please wait for admin verification before taking the quiz." 
            : "You can now browse verified students and book sessions."
        });
      }
    } catch (error: any) {
      toast({
        title: isLogin ? "Login failed" : "Signup failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-white border border-gray-200"
              >
                <ArrowLeft className="w-5 h-5 text-green-600" />
              </motion.button>
            )}
            <div className="flex-1"></div>
            <Link to="/" className="p-2 rounded-full bg-white border border-gray-200">
              <Home className="w-5 h-5 text-green-600" />
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center"
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-xl font-bold text-green-600">Hireveno</h1>
          </div>
          <p className="text-sm text-gray-600">
            {isLogin ? "Welcome back!" : "Join our community"}
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-bold text-gray-800">
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {isLogin ? 'Enter your credentials to access your account' : 'Fill in your details to get started'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                      I am a...
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'student' | 'aspirant') => handleInputChange('role', value)}
                    >
                      <SelectTrigger className="border-gray-200 focus:border-green-500">
                        <div className="flex items-center gap-2">
                          {formData.role === 'student' ? (
                            <GraduationCap className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Users className="w-4 h-4 text-gray-400" />
                          )}
                          <SelectValue placeholder="Select your role" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            UNIOSUN Student
                          </div>
                        </SelectItem>
                        <SelectItem value="aspirant">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Aspirant
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="jamb_reg" className="text-sm font-medium text-gray-700">
                          JAMB Registration Number
                        </Label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="jamb_reg"
                            type="text"
                            placeholder="Enter your JAMB reg number"
                            value={formData.jamb_reg}
                            onChange={(e) => handleInputChange('jamb_reg', e.target.value)}
                            required
                            className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                          Department
                        </Label>
                        <Select
                          value={formData.department_id}
                          onValueChange={(value) => handleInputChange('department_id', value)}
                        >
                          <SelectTrigger className="border-gray-200 focus:border-green-500">
                            <SelectValue placeholder="Select your department" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-green-600 hover:text-green-700 font-medium p-0 h-auto text-sm"
              >
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthForm;

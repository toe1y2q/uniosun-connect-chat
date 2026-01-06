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
import { ArrowLeft, GraduationCap, Users, Mail, Lock, User, BookOpen, Home, Building2 } from 'lucide-react';
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
    role: 'student' as 'student' | 'aspirant' | 'employer',
    jamb_reg: '',
    department_id: '',
    company_name: ''
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
          department_id: formData.role === 'student' ? formData.department_id : undefined,
          company_name: formData.role === 'employer' ? formData.company_name : undefined
        });
        if (error) throw error;
        
        const successMessages: Record<string, string> = {
          student: "Please wait for admin verification before taking the quiz.",
          aspirant: "You can now browse gigs and start earning!",
          employer: "You can now post gigs and hire talented students."
        };
        
        toast({
          title: "Account created successfully!",
          description: successMessages[formData.role]
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="w-4 h-4" />;
      case 'employer': return <Building2 className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
                className="p-2 rounded-full bg-card border border-border"
              >
                <ArrowLeft className="w-5 h-5 text-primary" />
              </motion.button>
            )}
            <div className="flex-1"></div>
            <Link to="/" className="p-2 rounded-full bg-card border border-border">
              <Home className="w-5 h-5 text-primary" />
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/lovable-uploads/bbe1b728-9234-4e9e-95cd-e4112dd8873c.png" 
              alt="Hireveno Logo" 
              className="h-10 w-10"
            />
            <h1 className="text-xl font-bold text-foreground">Hireveno</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Welcome back!" : "Join our community"}
          </p>
        </div>

        <Card className="shadow-lg border-border bg-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-bold text-foreground">
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {isLogin ? 'Enter your credentials to access your account' : 'Fill in your details to get started'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-foreground">
                      I am a...
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'student' | 'aspirant' | 'employer') => handleInputChange('role', value)}
                    >
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(formData.role)}
                          <SelectValue placeholder="Select your role" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Student (Earn Money)
                          </div>
                        </SelectItem>
                        <SelectItem value="employer">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Employer (Hire Students)
                          </div>
                        </SelectItem>
                        <SelectItem value="aspirant">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Aspirant (Get Guidance)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="jamb_reg" className="text-sm font-medium text-foreground">
                          JAMB Registration Number
                        </Label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="jamb_reg"
                            type="text"
                            placeholder="Enter your JAMB reg number"
                            value={formData.jamb_reg}
                            onChange={(e) => handleInputChange('jamb_reg', e.target.value)}
                            required
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-sm font-medium text-foreground">
                          Department
                        </Label>
                        <Select
                          value={formData.department_id}
                          onValueChange={(value) => handleInputChange('department_id', value)}
                        >
                          <SelectTrigger>
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

                  {formData.role === 'employer' && (
                    <div className="space-y-2">
                      <Label htmlFor="company_name" className="text-sm font-medium text-foreground">
                        Company Name (Optional)
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="company_name"
                          type="text"
                          placeholder="Enter your company name"
                          value={formData.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80 font-medium p-0 h-auto text-sm"
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

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, Star, BookOpen, MessageSquare, Award, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
interface HomePageProps {
  onGetStarted: () => void;
}
const HomePage: React.FC<HomePageProps> = ({
  onGetStarted
}) => {
  return <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-green-800/10"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} className="flex items-center justify-center gap-4 mb-8">
              <motion.div whileHover={{
              rotate: 360
            }} transition={{
              duration: 0.6
            }} className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-800 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-12 h-12 text-white" />
              </motion.div>
              <div className="text-left">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  UNIOSUN Connect
                </h1>
                <p className="text-xl text-gray-600 mt-2">Bridging Aspirants with Academic Excellence</p>
              </div>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.2
          }} className="max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Connect with Verified UNIOSUN Students
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Get personalized guidance from top-performing students who've excelled in their academic journey. 
                Book one-on-one sessions, chat with mentors, and accelerate your path to university success.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={onGetStarted} size="lg" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 text-lg">
                  Get Started Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Link to="/talents">
                  <Button variant="outline" size="lg" className="border-green-600 text-green-700 hover:bg-green-50 px-8 py-4 text-lg w-full sm:w-auto">
                    <Eye className="w-5 h-5 mr-2" />
                    Browse Talents
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }} className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose UNIOSUN Connect?</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform connects you with verified, high-achieving students who understand your journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }}>
            <Card className="h-full border-green-200 hover:border-green-300 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-green-800">Verified Excellence</CardTitle>
                <CardDescription>
                  All our student mentors are verified through academic records and pass rigorous qualification tests
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5
        }}>
            <Card className="h-full border-green-200 hover:border-green-300 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-green-800">Personalized Guidance</CardTitle>
                <CardDescription>
                  One-on-one sessions tailored to your specific needs, subjects, and academic goals
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.6
        }}>
            <Card className="h-full border-green-200 hover:border-green-300 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-green-800">Flexible Learning</CardTitle>
                <CardDescription>
                  Choose from various session lengths and formats that fit your schedule and learning style
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.7
      }} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
            <p className="text-gray-600">Verified Students</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
            <p className="text-gray-600">Academic Departments</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">4.8★</div>
            <p className="text-gray-600">Average Rating</p>
          </div>
        </motion.div>

        {/* User Types */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.8
      }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-800">For Aspirants</CardTitle>
                  <Badge className="bg-green-100 text-green-800">Get Guidance</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Browse verified student profiles</li>
                <li>• Book personalized study sessions</li>
                <li>• Get subject-specific help</li>
                <li>• Receive admission guidance</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-800">For Students</CardTitle>
                  <Badge className="bg-green-100 text-green-800">Share Knowledge</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Get verified as a mentor</li>
                <li>• Earn money helping others</li>
                <li>• Build your reputation</li>
                <li>• Flexible scheduling</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.9
        }}>
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students and aspirants who are already benefiting from our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={onGetStarted} size="lg" className="bg-white text-green-700 hover:bg-green-50 px-8 py-4 text-lg">
                Join as Aspirant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button onClick={onGetStarted} variant="outline" size="lg" className="border-white hover:bg-white px-8 py-4 text-lg text-green-700">
                Join as Student
                <GraduationCap className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>;
};
export default HomePage;
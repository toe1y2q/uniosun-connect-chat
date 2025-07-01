import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { GraduationCap, Users, BookOpen, Award, Star, ChevronRight, CheckCircle, Zap, Shield, Heart } from 'lucide-react';
interface HomePageProps {
  onGetStarted: () => void;
}
const HomePage = ({
  onGetStarted
}: HomePageProps) => {
  const fadeInUp = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    },
    transition: {
      duration: 0.6
    }
  };
  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  return <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-green-600">
              Hireveno
            </span>
          </div>
          <Button onClick={onGetStarted} className="bg-green-600 hover:bg-green-700 text-sm md:text-base md:px-4 md:py-2 px-[7px] mx-[14px] my-0 py-[9px]">
            Get Started
            <ChevronRight className="w-3 h-3 ml-1 md:w-4 md:h-4 md:ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-12 md:py-24 lg:py-32">
        <div className="container mx-auto text-center">
          <motion.div {...fadeInUp}>
            <Badge className="mb-6 bg-green-100 text-green-800 border-green-200 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Now Live for UNIOSUN Students & Aspirants
            </Badge>
          </motion.div>
          
          <motion.h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-green-600 leading-tight" {...fadeInUp}>
            Connect. Learn. Succeed.
          </motion.h1>
          
          <motion.p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed" {...fadeInUp}>
            Hireveno bridges the gap between UNIOSUN students and aspirants, creating a dynamic learning ecosystem where knowledge flows freely.
          </motion.p>
          
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center items-center" {...fadeInUp}>
            <Button onClick={onGetStarted} size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4 h-auto w-full sm:w-auto">
              Join Hireveno Today
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-green-400 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-green-300 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-sm font-medium">Join 500+ active users</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-green-50">
        <div className="container mx-auto">
          <motion.div className="text-center mb-12" {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Hireveno?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Our platform is designed specifically for the UNIOSUN community, offering tailored solutions for both students and aspirants.
            </p>
          </motion.div>
          
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={staggerChildren} initial="initial" whileInView="animate" viewport={{
          once: true
        }}>
            {[{
            icon: Users,
            title: "Expert Tutoring",
            description: "Connect with verified UNIOSUN students for personalized learning sessions.",
            color: "text-green-600"
          }, {
            icon: BookOpen,
            title: "Department-Specific Help",
            description: "Get assistance tailored to your specific department and course requirements.",
            color: "text-green-600"
          }, {
            icon: Award,
            title: "Verified Talents",
            description: "All tutors pass our rigorous verification process and department quizzes.",
            color: "text-green-600"
          }, {
            icon: Shield,
            title: "Secure Platform",
            description: "Safe and secure environment with built-in moderation and reporting tools.",
            color: "text-green-600"
          }, {
            icon: Zap,
            title: "Instant Booking",
            description: "Book sessions instantly with real-time availability and scheduling.",
            color: "text-green-600"
          }, {
            icon: Heart,
            title: "Community Driven",
            description: "Built by UNIOSUN students, for the UNIOSUN community.",
            color: "text-green-600"
          }].map((feature, index) => <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
                  <CardHeader>
                    <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 bg-white">
        <div className="container mx-auto">
          <motion.div className="text-center mb-12" {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Hireveno Works</h2>
            <p className="text-gray-600 text-lg">Simple steps to start your learning journey</p>
          </motion.div>
          
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" variants={staggerChildren} initial="initial" whileInView="animate" viewport={{
          once: true
        }}>
            {[{
            step: "1",
            title: "Sign Up",
            description: "Create your account as a student or aspirant"
          }, {
            step: "2",
            title: "Get Verified",
            description: "Complete verification and take department quiz (for students)"
          }, {
            step: "3",
            title: "Browse & Book",
            description: "Find verified tutors and book sessions"
          }, {
            step: "4",
            title: "Learn & Grow",
            description: "Attend sessions and achieve your academic goals"
          }].map((item, index) => <motion.div key={index} variants={fadeInUp} className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 bg-green-600 text-white">
        <div className="container mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Learning?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands of UNIOSUN students and aspirants already using Hireveno</p>
            <Button onClick={onGetStarted} size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto">
              Get Started Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">Hireveno</span>
          </div>
          <p className="text-gray-400 mb-4">Empowering the UNIOSUN community through connected learning</p>
          <p className="text-gray-500 text-sm">© 2024 Hireveno. Built with ❤️ for UNIOSUN students and aspirants.</p>
        </div>
      </footer>
    </div>;
};
export default HomePage;

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Users, 
  MessageSquare, 
  Award, 
  BookOpen, 
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Heart,
  Shield,
  TrendingUp
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: GraduationCap,
      title: "Verified UNIOSUN Students",
      description: "Connect with authenticated students who've passed our knowledge quiz",
      color: "text-blue-600"
    },
    {
      icon: MessageSquare,
      title: "Secure Chat Platform",
      description: "Safe, monitored conversations focused on academic guidance",
      color: "text-green-600"
    },
    {
      icon: Award,
      title: "Earn & Learn",
      description: "Students earn money while helping aspirants achieve their dreams",
      color: "text-purple-600"
    },
    {
      icon: Shield,
      title: "Trusted & Safe",
      description: "Moderated platform with strict academic focus and safety measures",
      color: "text-orange-600"
    }
  ];

  const stats = [
    { number: "500+", label: "Verified Students", icon: Users },
    { number: "1000+", label: "Successful Sessions", icon: MessageSquare },
    { number: "15", label: "Academic Departments", icon: BookOpen },
    { number: "98%", label: "Satisfaction Rate", icon: Star }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center"
              >
                <GraduationCap className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                UNIOSUN Connect
              </h1>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={onGetStarted}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-full font-medium"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 py-16 max-w-7xl mx-auto"
      >
        <div className="text-center mb-16">
          <motion.div
            variants={itemVariants}
            className="inline-block mb-4"
          >
            <Badge className="bg-indigo-100 text-indigo-700 px-4 py-2 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Trusted by 1000+ Students & Aspirants
            </Badge>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Connect with
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              UNIOSUN Students
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Get personalized guidance from verified UNIOSUN students. Ask questions about campus life, 
            academics, and everything you need to know about university life.
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-full text-lg font-medium"
              >
                <Heart className="w-5 h-5 mr-2" />
                Start Your Journey
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-8 py-3 rounded-full text-lg font-medium"
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center"
            >
              <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">{stat.number}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Section */}
        <motion.div 
          variants={containerVariants}
          className="mb-16"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Why Choose UNIOSUN Connect?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A safe, verified platform connecting aspirants with experienced UNIOSUN students
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Card className="h-full border-0 shadow-lg bg-white/60 backdrop-blur-sm group-hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center ${feature.color}`}>
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div 
          variants={containerVariants}
          className="mb-16"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to connect with UNIOSUN students
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up",
                description: "Create your account as a student or aspirant",
                icon: Users
              },
              {
                step: "2",
                title: "Get Verified",
                description: "Students take a quiz, aspirants browse talents",
                icon: CheckCircle
              },
              {
                step: "3",
                title: "Connect",
                description: "Book sessions and start meaningful conversations",
                icon: MessageSquare
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {step.step}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          variants={itemVariants}
          className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students and aspirants already using UNIOSUN Connect
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-medium"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Join UNIOSUN Connect
            </Button>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">UNIOSUN Connect</span>
          </div>
          <p className="text-gray-400">
            Connecting UNIOSUN students with aspiring scholars since 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

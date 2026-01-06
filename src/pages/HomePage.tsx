import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Shield, 
  Clock, 
  Users, 
  Briefcase, 
  GraduationCap,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  TrendingUp,
  MapPin
} from "lucide-react";

interface HomePageProps {
  onGetStarted: () => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const HomePage = ({ onGetStarted }: HomePageProps) => {
  const features = [
    {
      icon: Wallet,
      title: "Instant Earnings",
      description: "Get paid directly to your wallet. Withdraw anytime to your bank account.",
      color: "bg-emerald-500/10 text-emerald-600"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Escrow-protected payments. Your earnings are guaranteed before you start.",
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      icon: Briefcase,
      title: "Flexible Gigs",
      description: "Choose from micro-jobs, freelance work, campus hustles, and remote opportunities.",
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      icon: MapPin,
      title: "Nationwide Reach",
      description: "Find opportunities on your campus, in your city, or work remotely from anywhere.",
      color: "bg-orange-500/10 text-orange-600"
    },
    {
      icon: Star,
      title: "Build Your Profile",
      description: "Earn ratings and reviews. Stand out to employers with your track record.",
      color: "bg-yellow-500/10 text-yellow-600"
    },
    {
      icon: Clock,
      title: "Work Your Schedule",
      description: "Accept gigs that fit your class schedule. Study and earn on your terms.",
      color: "bg-pink-500/10 text-pink-600"
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Create Your Profile",
      description: "Sign up with your student email, verify your identity, and showcase your skills.",
      icon: GraduationCap
    },
    {
      step: "02",
      title: "Browse & Apply",
      description: "Explore gigs that match your skills and schedule. Apply with one tap.",
      icon: Briefcase
    },
    {
      step: "03",
      title: "Complete the Gig",
      description: "Deliver quality work. Communicate with employers through our secure chat.",
      icon: CheckCircle
    },
    {
      step: "04",
      title: "Get Paid",
      description: "Receive payment instantly to your wallet. Withdraw to your bank anytime.",
      icon: Wallet
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Students" },
    { value: "5K+", label: "Gigs Completed" },
    { value: "₦50M+", label: "Paid to Students" },
    { value: "500+", label: "Employers" }
  ];

  const categories = [
    { name: "Tutoring", icon: "📚", count: "234 gigs" },
    { name: "Design", icon: "🎨", count: "156 gigs" },
    { name: "Writing", icon: "✍️", count: "189 gigs" },
    { name: "Delivery", icon: "🚀", count: "78 gigs" },
    { name: "Tech", icon: "💻", count: "312 gigs" },
    { name: "Events", icon: "🎉", count: "95 gigs" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/bbe1b728-9234-4e9e-95cd-e4112dd8873c.png" 
              alt="Hireveno Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-foreground">Hireveno</span>
          </div>
          <Button onClick={onGetStarted} className="font-semibold">
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <motion.div 
          className="container mx-auto text-center relative z-10"
          initial="initial"
          animate="animate"
          variants={staggerChildren}
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              Nigeria's #1 Student Gig Platform
            </Badge>
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
            variants={fadeInUp}
          >
            Earn Money
            <br />
            <span className="text-primary">While You Study</span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Connect with employers, complete gigs, and build your income. 
            Verified opportunities for Nigerian students nationwide.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            variants={fadeInUp}
          >
            <Button size="lg" onClick={onGetStarted} className="text-lg px-8 py-6 font-semibold">
              Start Earning Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={onGetStarted} className="text-lg px-8 py-6 font-semibold">
              I Want to Hire Students
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Popular Gig Categories
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From tutoring to tech, find opportunities that match your skills
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            {categories.map((category, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Students Love Hireveno
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built by students, for students. We understand your hustle.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-all bg-card border-border">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start earning in 4 simple steps
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            {howItWorks.map((step, index) => (
              <motion.div key={index} variants={fadeInUp} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-sm font-bold text-primary mb-2">Step {step.step}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* For Employers Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-3xl p-8 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">
                  <Users className="w-4 h-4 mr-2" />
                  For Employers
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Hire Verified Students
                </h2>
                <p className="text-muted-foreground mb-6">
                  Access a pool of talented, verified students ready to help with your projects. 
                  Secure escrow payments, quality guarantees, and dedicated support.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Post gigs in minutes",
                    "Verified student profiles",
                    "Escrow-protected payments",
                    "Campus to nationwide reach"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" onClick={onGetStarted} className="font-semibold">
                  Post a Gig
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 bg-primary/20 rounded-full blur-3xl absolute" />
                  <div className="relative bg-card border border-border rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-8 h-8 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">Employer Dashboard</div>
                        <div className="text-sm text-muted-foreground">Manage your gigs</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-foreground">Active Gigs</span>
                        <span className="font-bold text-foreground">12</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-foreground">Students Hired</span>
                        <span className="font-bold text-foreground">48</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-foreground">Avg. Rating</span>
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          4.9
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <motion.div 
          className="container mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join thousands of students already making money on Hireveno. 
            Your first gig is just a click away.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={onGetStarted}
            className="text-lg px-8 py-6 font-semibold"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-background">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/bbe1b728-9234-4e9e-95cd-e4112dd8873c.png" 
                alt="Hireveno Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold text-foreground">Hireveno</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">How it Works</a>
              <a href="#" className="hover:text-foreground transition-colors">Trust & Safety</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Hireveno. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

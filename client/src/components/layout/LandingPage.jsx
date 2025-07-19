import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  Users, 
  FileText, 
  Clock, 
  Shield, 
  BarChart3,
  Star,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import heroBackground from "../../assets/hero background.jpg";
import aboutBackground from "../../assets/about.jpg";
import ctaBackground from "../../assets/cta.jpg";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };
  const navigate = useNavigate()
  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: Users,
      title: "Student Enrollment",
      description: "Streamlined registration and enrollment process for new and returning students."
    },
    {
      icon: FileText,
      title: "Grade & Transcript Management",
      description: "Comprehensive grade tracking and transcript generation for academic records."
    },
    {
      icon: Clock,
      title: "Attendance Tracking",
      description: "Real-time attendance monitoring with automated reporting capabilities."
    },
    {
      icon: GraduationCap,
      title: "Report Card Generation",
      description: "Professional report cards with detailed academic performance metrics."
    },
    {
      icon: Shield,
      title: "Parent & Staff Access",
      description: "Secure access portals for parents and staff with role-based permissions."
    },
    {
      icon: BarChart3,
      title: "Academic Analytics",
      description: "Data-driven insights to improve educational outcomes and performance."
    }
  ];

  const testimonials = [
    {
      name: "Mary Johnson",
      role: "Parent",
      content: "The system has made it so much easier to track my child's progress. I can access grades and attendance reports anytime.",
      rating: 5
    },
    {
      name: "James Wilson",
      role: "Mathematics Teacher",
      content: "Grade management has never been this efficient. The analytics help me understand student performance patterns better.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/School Name */}
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg">VMHS</span>
            </div>

           

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" onClick={()=>navigate('/login')}>Login</Button>
              <Button onClick={()=>navigate('/register')} >Register</Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t"
            >
              <div className="flex flex-col space-y-4">
              
                <div className="flex flex-col space-y-2 pt-4">
                  <Button variant="ghost" className="justify-start" onClick={()=>navigate('/login')}>Login</Button>
                  <Button className="justify-start" onClick={()=>navigate('/register')}>Register</Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-20 lg:py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80" />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.h1 
              className="text-4xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg"
              variants={fadeInUp}
            >
              Empowering Education with Technology
            </motion.h1>
            <motion.p 
              className="text-xl text-white/90 mb-8 leading-relaxed drop-shadow-md"
              variants={fadeInUp}
            >
              Manage student records, grades, and reports in one centralized platform.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 hover:scale-105 transition-transform bg-white text-primary hover:bg-white/90 shadow-lg"
              onClick={()=>navigate('/register')}
              >
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${aboutBackground})` }}
        />
        <div className="absolute inset-0 bg-background/95" />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-8">About Our School</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              VOINJAMA MULTILATERAL HIGH SCHOOL, based in Voinjama City, Lofa County, Republic of Liberia, 
              is committed to academic excellence and digital transformation in education. We strive to provide 
              quality education that prepares our students for success in the modern world.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <motion.div 
                className="text-center"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Academic Excellence</h3>
                <p className="text-sm text-muted-foreground">Committed to providing quality education</p>
              </motion.div>
              <motion.div 
                className="text-center"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Community Focus</h3>
                <p className="text-sm text-muted-foreground">Building strong community relationships</p>
              </motion.div>
              <motion.div 
                className="text-center"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Future Ready</h3>
                <p className="text-sm text-muted-foreground">Preparing students for tomorrow</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive school management system offers everything you need to streamline 
              educational administration and enhance learning outcomes.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Community Says</h2>
            <p className="text-lg text-muted-foreground">
              Hear from parents and teachers who use our system daily
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${ctaBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/85" />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-white drop-shadow-lg">
              Join us in transforming education at VMHS
            </h2>
            <p className="text-lg text-white/90 mb-8 drop-shadow-md">
              Ready to experience the future of school management? Get started today and see 
              how our platform can revolutionize your educational institution.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 hover:scale-105 transition-transform bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              Request a Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-muted border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl">VOINJAMA MULTILATERAL HIGH SCHOOL</span>
              </div>
              <p className="text-muted-foreground mb-4 italic font-medium">
                "Striving for Posterity"
              </p>
              <p className="text-sm text-muted-foreground">
                Voinjama City, Lofa County, Republic of Liberia
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Contact Info</a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary">f</span>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary">t</span>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary">in</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Voinjama Multilateral High School. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
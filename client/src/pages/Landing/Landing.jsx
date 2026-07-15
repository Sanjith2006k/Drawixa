import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenTool, Share2, FileText, Sparkles, Layout, Layers } from 'lucide-react';
import Iridescence from '../../background/Iridescence';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';

const features = [
  {
    icon: <PenTool className="w-6 h-6 text-primary" />,
    title: "Infinite Canvas",
    description: "Never run out of space. Zoom, pan, and draw freely on an unbounded whiteboard."
  },
  {
    icon: <FileText className="w-6 h-6 text-accent" />,
    title: "PDF Annotation",
    description: "Upload PDFs instantly. Highlight, draw, and add sticky notes directly on your documents."
  },
  {
    icon: <Share2 className="w-6 h-6 text-highlight" />,
    title: "Real-time Collaboration",
    description: "Work together seamlessly with live cursors, presence indicators, and instant syncing."
  },
  {
    icon: <Sparkles className="w-6 h-6 text-primary" />,
    title: "Lag-Free Performance",
    description: "Built for speed. Experience a buttery smooth, zero-latency drawing engine."
  },
  {
    icon: <Layout className="w-6 h-6 text-accent" />,
    title: "Cross-Device Sync",
    description: "Access your boards from any device. Perfectly scaled for tablets, phones, and desktops."
  },
  {
    icon: <Layers className="w-6 h-6 text-highlight" />,
    title: "Secure Cloud Storage",
    description: "Your drawings and documents are automatically saved and securely backed up in the cloud."
  }
];


function FadeIn({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Landing() {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Iridescence
          color={[0.219, 0.455, 1]} 
          mouseReact={false}
          amplitude={0.08}
          speed={0.6}
        />
        <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" />
      </div>

      <Navbar />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[90vh] text-center">
          <FadeIn delay={0.1}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white mb-6 max-w-5xl leading-tight">
              The collaborative canvas for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-highlight">modern teams.</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-textSecondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Infinite whiteboards, real-time PDF annotation, and AI-powered productivity. Build, brainstorm, and bring ideas to life—together.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="primary" size="lg">Start drawing for free</Button>
              </Link>
              <a href="#preview">
                <Button variant="secondary" size="lg">View Demo</Button>
              </a>
            </div>
          </FadeIn>
        </section>

        {/* Product Preview */}
        <section id="preview" className="px-6 pb-32 max-w-7xl mx-auto">
          <FadeIn>
            <div className="w-full border border-borderColor/50 rounded-3xl overflow-hidden shadow-2xl relative group cursor-pointer bg-surface/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-highlight/20 mix-blend-overlay z-10 transition-opacity duration-500 group-hover:opacity-0" />
              <img 
                src="/dashboard-preview.png" 
                alt="Drawixa Dashboard Preview" 
                className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl z-20 pointer-events-none" />
            </div>
          </FadeIn>
        </section>

        {/* Features Grid */}
        <section id="features" className="px-6 py-32 bg-surface/30 border-y border-borderColor backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <FadeIn>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Everything you need to create.</h2>
                <p className="text-xl text-textSecondary max-w-2xl mx-auto">
                  A powerful suite of tools designed to help you think without boundaries.
                </p>
              </FadeIn>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FadeIn key={index} delay={index * 0.1}>
                  <GlassCard className="h-full hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-textSecondary leading-relaxed">{feature.description}</p>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="px-6 py-32 text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready to start creating?</h2>
            <p className="text-xl text-textSecondary max-w-2xl mx-auto mb-10">
              Join thousands of teams using Drawixa to map out their next big idea.
            </p>
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Get Started for Free
            </Button>
          </FadeIn>
        </section>

        {/* Footer */}
        <footer className="border-t border-borderColor px-6 py-12 bg-surface/50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Drawixa</span>
            </div>
            <p className="text-textSecondary text-sm">
              Made by <a href="https://github.com/Sanjith2006k" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Sanjith2006k</a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

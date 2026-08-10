import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search, MapPin, ArrowRight, Sparkles, Compass, Trophy, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BrandNav from '@/components/BrandNav';
import SEO from '@/components/SEO';

interface AppErrorProps {
  code?: string;
  title: string;
  description: string;
  action?: 'home' | 'reload';
  path?: string;
}

export default function AppError({ code = '404', title, description, action = 'home', path }: AppErrorProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950">
      <SEO title={`${code} - Page Out of Bounds | QuickCourt`} description="The requested page could not be found on QuickCourt." />
      
      {/* Background Decorative Gradients & Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-emerald-400/10 rounded-full blur-[100px]" />
        {/* Court Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Brand Navbar */}
      <div className="relative z-20">
        <BrandNav />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-3xl text-center space-y-8"
        >
          {/* Animated Sports Graphic & 404 Badge */}
          <div className="relative flex justify-center items-center py-4">
            {/* Glowing Backdrop Circle */}
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Ring */}
              <motion.div
                className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-emerald-500/30 bg-emerald-500/5"
                animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Glowing Inner Ring */}
              <motion.div
                className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />

              {/* Bouncing Ball Animation */}
              <motion.div
                className="absolute -top-3 sm:-top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.8)] border-2 border-yellow-100 flex items-center justify-center"
                animate={{
                  y: [0, -28, 0],
                  scale: [1, 0.9, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-full h-[1.5px] bg-yellow-600/60 rounded-full" />
              </motion.div>

              {/* 404 Big Code display */}
              <motion.h1
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-7xl sm:text-9xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-emerald-100 to-emerald-500/40 select-none drop-shadow-2xl"
              >
                {code}
              </motion.h1>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Out of Bounds</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              {description}
            </p>

            {path && (
              <div className="inline-block mt-2">
                <span className="inline-flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 text-emerald-400 px-3 py-1.5 rounded-lg max-w-full truncate">
                  <span className="text-slate-500">Requested Route:</span> {path}
                </span>
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {action === 'reload' ? (
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 h-12 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 h-12 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02]"
              >
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Return to Home
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white px-8 h-12 rounded-xl transition-all duration-300"
            >
              <Link to="/venues">
                <Compass className="mr-2 h-4 w-4 text-emerald-400" />
                Browse Venues
              </Link>
            </Button>
          </div>

          {/* Quick Category Chips */}
          <div className="pt-6 border-t border-slate-800/80 max-w-xl mx-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Quick Venue Discovery
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Badminton', 'Tennis', 'Football', 'Cricket', 'Basketball'].map((sport) => (
                <Link
                  key={sport}
                  to={`/venues?sport=${encodeURIComponent(sport)}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
                >
                  {sport}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer Branding Bar */}
      <footer className="relative z-10 border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} QuickCourt • Premium Sports Facility Booking Platform
      </footer>
    </div>
  );
}

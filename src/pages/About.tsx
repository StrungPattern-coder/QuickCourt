import React from 'react';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BrandNav from '@/components/BrandNav';
import PosterHero from '@/components/PosterHero';
import { ArrowRight, CheckCircle2, Clock, Layers3, Shield, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const facts = [
  { label: 'Built At', value: 'Odoo India Hackathon 2025' },
  { label: 'Stage', value: 'Finals' },
  { label: 'Duration', value: '24 hours' },
  { label: 'Team', value: '4 members' }
];

const pillars = [
  { icon: <Layers3 className="h-5 w-5" />, title: 'One booking surface', desc: 'Players can search venues, inspect courts, reserve slots, and track bookings from one flow.' },
  { icon: <Shield className="h-5 w-5" />, title: 'Role-aware operations', desc: 'Owners manage facilities while admins review venues, users, bookings, and platform health.' },
  { icon: <Trophy className="h-5 w-5" />, title: 'Engagement layer', desc: 'Points, streaks, badges, referrals, and reviews make repeat play feel rewarding.' }
];

const built = [
  'Dynamic venue discovery with filters and approved-facility visibility',
  'Email/password auth, OTP verification, OTP login, and password reset support',
  'Owner dashboard for facility and court setup',
  'Admin dashboard for approvals, users, bookings, and analytics',
  'Booking overlap prevention, receipts, reviews, and loyalty tracking'
];

const About: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const heroActions = isAuthenticated
    ? [
        { label: 'Explore Venues', to: '/venues' },
        { label: user?.role === 'OWNER' ? 'Owner Dashboard' : user?.role === 'ADMIN' ? 'Admin Dashboard' : 'My Bookings', to: user?.role === 'OWNER' ? '/owner/dashboard' : user?.role === 'ADMIN' ? '/admin' : '/my-bookings', variant: 'secondary' as const }
      ]
    : [
        { label: 'Create Account', to: '/signup' },
        { label: 'Sign In', to: '/login', variant: 'secondary' as const }
      ];

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <SEO title="About QuickCourt" description="QuickCourt was built during the Odoo India Hackathon 2025 finals by a team of four." path="/about" />
      <BrandNav />

      <PosterHero
        eyebrow="About QuickCourt"
        title="Built in 24 hours for the finals."
        description="QuickCourt is a multi-sport venue discovery and booking platform we built as a team of four during the finals of the 24-hour Odoo India Hackathon 2025."
        actions={heroActions}
      />

      <section className="border-b border-gray-200 bg-gray-950 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-white/10 px-5 sm:grid-cols-4 sm:px-6 lg:px-8">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-gray-950 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{fact.label}</p>
              <p className="mt-2 text-base font-semibold text-white sm:text-lg">{fact.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Origin</p>
              <h2 className="mt-4 text-3xl font-bold text-gray-950 sm:text-5xl">
                A finals project shaped by speed, scope, and real product pressure.
              </h2>
            </motion.div>
            <div className="space-y-6 text-base leading-8 text-gray-600">
              <p>
                The brief pushed us to think beyond a static booking screen. We designed QuickCourt as a working platform with players, venue owners, and admins all operating on the same live data model.
              </p>
              <p>
                The result is a full-stack product: auth, profiles, role-based dashboards, venue approval, court booking, reviews, receipts, and loyalty mechanics. The production version now starts clean, without seeded demo accounts or fake venue data.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Product pillars</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-bold text-gray-950 sm:text-5xl">
                Built for the full sports booking loop.
              </h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  {pillar.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-950">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">What is included</p>
            <h2 className="mt-4 text-3xl font-bold text-gray-950 sm:text-5xl">
              The build is practical, not just presentational.
            </h2>
          </div>
          <div className="space-y-4">
            {built.map((item) => (
              <div key={item} className="flex gap-3 border-b border-gray-200 pb-4">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <p className="text-base leading-7 text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3 text-emerald-300">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-[0.18em]">24-hour build</span>
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">From hackathon finals to deployed product.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                QuickCourt now runs as a Vercel-deployed app backed by PostgreSQL, ready for fresh accounts, venue submissions, approvals, and bookings.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {isAuthenticated ? (
                <>
                  <Button asChild className="h-12 bg-emerald-400 px-6 text-gray-950 hover:bg-emerald-300">
                    <Link to="/venues">
                      Explore Venues
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white">
                    <Link to={user?.role === 'OWNER' ? '/owner/dashboard' : user?.role === 'ADMIN' ? '/admin' : '/my-bookings'}>
                      {user?.role === 'OWNER' ? 'Owner Dashboard' : user?.role === 'ADMIN' ? 'Admin Dashboard' : 'My Bookings'}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="h-12 bg-emerald-400 px-6 text-gray-950 hover:bg-emerald-300">
                    <Link to="/signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white">
                    <Link to="/login">Log In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

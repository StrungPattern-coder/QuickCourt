import React from 'react';
import { motion } from 'framer-motion';
import MaskedHeading from '@/components/MaskedHeading';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface HeroAction {
  label: string;
  to: string;
  variant?: 'primary' | 'secondary';
}

interface PosterHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: HeroAction[];
  children?: React.ReactNode;
}

export default function PosterHero({ eyebrow, title, description, actions = [], children }: PosterHeroProps) {
  return (
    <section className="relative min-h-[88svh] overflow-hidden bg-[#f7faf7]">
      <div className="absolute inset-x-0 top-0 h-px bg-gray-200" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:64px_64px]" />
      <motion.div
        className="absolute left-0 right-0 top-[48%] h-px bg-emerald-500/40"
        animate={{ scaleX: [0.65, 1, 0.65], opacity: [0.2, 0.55, 0.2] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-2 w-full bg-emerald-400"
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />

      <div className="relative z-10 mx-auto flex min-h-[88svh] w-full max-w-6xl flex-col justify-center px-5 pb-14 pt-32 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-5xl"
        >
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            {eyebrow}
          </p>
          <MaskedHeading text={title} />
          <p className="mt-7 max-w-2xl text-base leading-8 text-gray-700 sm:text-xl">
            {description}
          </p>

          {actions.length > 0 && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  asChild
                  variant={action.variant === 'secondary' ? 'outline' : 'default'}
                  className={
                    action.variant === 'secondary'
                      ? 'h-12 border-gray-300 bg-white px-6 text-gray-950 hover:bg-emerald-50'
                      : 'h-12 bg-gray-950 px-6 text-white hover:bg-emerald-700'
                  }
                >
                  <Link to={action.to}>
                    {action.label}
                    {action.variant !== 'secondary' && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Link>
                </Button>
              ))}
            </div>
          )}

          {children}
        </motion.div>
      </div>
    </section>
  );
}

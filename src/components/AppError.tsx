import { motion } from 'framer-motion';
import { ArrowLeft, Home, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AppErrorProps {
  code?: string;
  title: string;
  description: string;
  action?: 'home' | 'reload';
  path?: string;
}

const courtLines = [
  'left-[14%] top-[18%] h-[64%] w-px',
  'right-[14%] top-[18%] h-[64%] w-px',
  'left-[14%] right-[14%] top-[18%] h-px',
  'left-[14%] right-[14%] bottom-[18%] h-px',
  'left-1/2 top-[18%] h-[64%] w-px',
  'left-[14%] right-[14%] top-1/2 h-px'
];

export default function AppError({ code = '404', title, description, action = 'home', path }: AppErrorProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07110d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(46,204,113,0.22),transparent_38%),linear-gradient(135deg,rgba(7,17,13,0.98),rgba(8,31,22,0.92))]" />
      <motion.div
        className="absolute inset-x-[8%] top-[16%] h-[62vh] rounded-[28px] border border-emerald-300/20 bg-emerald-400/[0.04]"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {courtLines.map((line) => (
          <motion.span
            key={line}
            className={`absolute ${line} bg-emerald-200/20`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.15, 0.42, 0.15] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <motion.span
          className="absolute left-[calc(50%-10px)] top-[calc(50%-10px)] h-5 w-5 rounded-full bg-emerald-300 shadow-[0_0_28px_rgba(110,231,183,0.8)]"
          animate={{ x: [-180, 180, -180], y: [-90, 90, -90] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-2xl"
        >
          <div className="mb-6 flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-emerald-200">
            <Search className="h-4 w-4" />
            QuickCourt
          </div>
          <motion.p
            className="mb-3 text-8xl font-black leading-none text-white/10 sm:text-9xl"
            initial={{ letterSpacing: '0.08em', opacity: 0 }}
            animate={{ letterSpacing: '0em', opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            {code}
          </motion.p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-emerald-50/75 sm:text-lg">
            {description}
          </p>
          {path && (
            <p className="mt-4 max-w-full break-all rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-emerald-100/75">
              {path}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {action === 'reload' ? (
              <Button onClick={() => window.location.reload()} className="h-12 bg-emerald-400 px-6 text-sm font-semibold text-emerald-950 hover:bg-emerald-300">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            ) : (
              <Button asChild className="h-12 bg-emerald-400 px-6 text-sm font-semibold text-emerald-950 hover:bg-emerald-300">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="h-12 border-white/18 bg-white/[0.03] px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white">
              <Link to="/venues">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Venues
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

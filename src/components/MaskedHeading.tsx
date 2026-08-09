import { motion } from 'framer-motion';

interface MaskedHeadingProps {
  text: string;
  className?: string;
}

export default function MaskedHeading({ text, className = '' }: MaskedHeadingProps) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <h1 className={`m-0 text-balance text-5xl font-black leading-[0.96] sm:text-7xl lg:text-8xl ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="mr-[0.18em] inline-block overflow-hidden align-bottom"
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.75, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            className="inline-block bg-[linear-gradient(110deg,#0b1117_0%,#0b1117_34%,#10b981_48%,#163b2d_58%,#0b1117_76%,#0b1117_100%)] bg-[length:260%_100%] bg-clip-text text-transparent"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.04 }}
          >
            {word}
          </motion.span>
        </motion.span>
      ))}
    </h1>
  );
}

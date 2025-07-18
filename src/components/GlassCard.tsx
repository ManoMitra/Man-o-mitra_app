import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <Tilt
      glareEnable={true}
      glareMaxOpacity={0.2}
      scale={1.02}
      tiltMaxAngleX={5}
      tiltMaxAngleY={5}
    >
      <motion.div
        className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.div>
    </Tilt>
  );
} 
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-background to-white px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-text-primary mb-6">
            Welcome to <span className="text-primary">ManoMitra</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            Your trusted companion in elderly care, bringing peace of mind to families through innovative technology.
          </p>
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-semibold text-lg shadow-lg"
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(127, 86, 217, 0.5)' }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl" />
          <img
            src="/Logo Title.png"
            alt="ManoMitra"
            className="w-full h-auto relative z-10"
          />
        </motion.div>
      </div>
    </div>
  );
} 
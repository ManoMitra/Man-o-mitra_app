import { motion } from 'framer-motion';

interface FeatureBlockProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

export default function FeatureBlock({ icon, title, description, onClick }: FeatureBlockProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-therapy-cream bg-opacity-50 backdrop-blur-sm rounded-xl p-6 cursor-pointer
                 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out
                 border border-therapy-sage/20"
      onClick={onClick}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-therapy-forest">{title}</h3>
      <p className="text-therapy-forest/80">{description}</p>
    </motion.div>
  );
} 
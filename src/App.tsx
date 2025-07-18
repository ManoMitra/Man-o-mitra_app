import { motion } from 'framer-motion';
import HeroSection from './components/HeroSection';
import GlassCard from './components/GlassCard';

const features = [
  {
    title: 'Face Recognition',
    description: 'Advanced AI-powered face recognition for secure and reliable identification.',
    icon: '👤'
  },
  {
    title: 'Medication Reminders',
    description: 'Smart reminders to ensure medications are taken on time, every time.',
    icon: '💊'
  },
  {
    title: 'Location Tracking',
    description: 'Real-time location monitoring for peace of mind and safety.',
    icon: '📍'
  },
  {
    title: 'Caregiver Support',
    description: 'Connect with qualified caregivers and manage care schedules effortlessly.',
    icon: '🤝'
  }
];

export default function App() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <HeroSection />
      
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-4xl font-extrabold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Features that Care
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <GlassCard 
                key={index}
                className="h-full"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 
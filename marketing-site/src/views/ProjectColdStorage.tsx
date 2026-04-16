import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PlatformSection } from '../components/PlatformSection';
import { ProblemSolution } from '../components/ProblemSolution';
import { MobileAppSection } from '../components/MobileAppSection';
import { IndustriesSection } from '../components/IndustriesSection';
import { SocialProofSection } from '../components/SocialProofSection';

interface ProjectColdStorageProps {
  setView: (view: string) => void;
}

export function ProjectColdStorage({ setView }: ProjectColdStorageProps) {
  return (
    <div className="pt-24 bg-space-900">
      
      {/* Project Header */}
      <div className="container-custom pb-12">
        <button 
          onClick={() => { setView('projects'); window.scrollTo(0,0); }}
          className="group flex items-center text-slate-500 hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </button>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 pb-12"
        >
          <div className="inline-block bg-brand-500/10 border border-brand-500/20 text-brand-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm">
            Agritech Innovation
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Solar IoT <br/><span className="text-gradient">Cold Storage Platform</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-light max-w-3xl leading-relaxed">
            The technical breakdown of our flagship monitoring and control software designed specifically for off-grid thermal arrays.
          </p>
        </motion.div>
      </div>

      {/* Reusing existing specific components */}
      <PlatformSection />
      <ProblemSolution />
      <MobileAppSection />
      <IndustriesSection />
      <SocialProofSection />
      
    </div>
  );
}

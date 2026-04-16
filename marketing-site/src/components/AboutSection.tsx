import { motion } from 'framer-motion';
import { Target, Compass } from 'lucide-react';

export function AboutSection() {
  return (
    <section id="about" className="section-padding relative overflow-hidden bg-space-900">
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 relative"
          >
            <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden glass-card p-2 md:p-4 border border-white/10">
               {/* Clean high-tech imagery */}
               <img 
                 src="/images/training.png"
                 alt="Smaatech Training & Infrastructure" 
                 className="w-full h-full object-cover rounded-2xl filter contrast-110 brightness-75"
                 loading="lazy"
               />
               
               <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-transparent mix-blend-overlay"></div>
            </div>
            
            {/* Floating Glass Stats */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="absolute -bottom-10 -right-4 md:-right-10 glass-card p-6 md:p-8 max-w-[280px] shadow-2xl"
            >
              <h4 className="font-black text-white text-2xl mb-2">Bhubaneswar</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Headquarters driving Eastern India's sustainable tech revolution across 20+ village networks.</p>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-block px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400 text-xs font-bold tracking-widest uppercase mb-6">
              Our Visionary Ethos
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white leading-tight">
              Bridging Heavy Infrastructure with <span className="text-gradient">Modern Tech.</span>
            </h2>
            
            <p className="text-slate-400 text-lg leading-relaxed mb-6 font-light">
              Smaatech Group doesn't just lay concrete. We engineer living, breathing systems. From civil construction for monumental water projects to the micro-controllers powering our cold storage IoT grids.
            </p>
            
            <p className="text-slate-300 text-lg leading-relaxed mb-12 font-light">
              We blend cutting-edge technology with traditional expertise to deliver transformative solutions that empower communities and preserve resources.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="glass-card p-6 hover:border-brand-500/50 transition-colors">
                <Compass className="w-8 h-8 text-brand-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Vision</h3>
                <p className="text-slate-400 text-sm leading-relaxed">To be Odisha's leading integrated solutions provider, fostering eco-friendly, resilient growth.</p>
              </div>
              
              <div className="glass-card p-6 hover:border-accent-400/50 transition-colors">
                <Target className="w-8 h-8 text-accent-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Mission</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Innovate relentlessly, empower communities, and build intelligent infrastructure for generations.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

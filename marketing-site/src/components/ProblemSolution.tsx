import { motion } from 'framer-motion';
import { XCircle, CheckCircle } from 'lucide-react';

export function ProblemSolution() {
  const problems = [
    "High spoilage due to unpredictable temperature deviations.",
    "Unreliable grid power and practically zero visibility into solar/battery backup health.",
    "No centralized dashboard to oversee managing a multi-site fleet.",
    "Delayed responses to critical issues because alerts rely on manual checks."
  ];

  const solutions = [
    "Continuous, accurate temperature & humidity monitoring via high-precision sensors.",
    "Solar and battery-aware insights to proactively prevent power-loss shutdowns.",
    "Centralized web dashboard and mobile access for full multi-site control.",
    "Instant push notifications and SMS alerts when thresholds are breached."
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section id="solutions" className="section-padding bg-space-900 border-t border-white/5 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6 text-white"
          >
            The Cost of <span className="text-red-500">Blind Spots</span> <br/> vs. <span className="text-brand-500">Total Control</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg relative z-10"
          >
            Traditional cold chains suffer from reactive management. Our platform brings predictive observability to prevent losses before they happen.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 max-w-6xl mx-auto">
          
          {/* Problems */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="glass-card p-8 lg:p-12 relative overflow-hidden group border-red-500/10"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
            
            <h3 className="text-3xl font-bold text-white mb-8 flex items-center tracking-tight">
              <span className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mr-4">
                <XCircle className="w-6 h-6 text-red-500" />
              </span>
              The Problem
            </h3>
            
            <motion.ul variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-6">
              {problems.map((prob, i) => (
                <motion.li key={i} variants={item} className="flex group/item">
                  <div className="mt-1 mr-4 flex-shrink-0">
                     <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-slate-400 text-lg leading-relaxed font-light">{prob}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Solutions */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="glass-card p-8 lg:p-12 relative overflow-hidden border-brand-500/10"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 to-brand-400"></div>
            
            <h3 className="text-3xl font-bold text-white mb-8 flex items-center tracking-tight">
              <span className="w-12 h-12 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-brand-500" />
              </span>
              Smaatech Platform
            </h3>
            
            <motion.ul variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-6">
              {solutions.map((sol, i) => (
                <motion.li key={i} variants={item} className="flex group/item">
                  <div className="mt-1 mr-4 flex-shrink-0 transition-transform group-hover/item:scale-110">
                     <CheckCircle className="w-5 h-5 text-brand-400" />
                  </div>
                  <span className="text-slate-400 text-lg leading-relaxed font-light">{sol}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

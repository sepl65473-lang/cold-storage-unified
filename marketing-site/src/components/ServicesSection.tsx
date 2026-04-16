import { motion } from 'framer-motion';
import { Droplets, Settings, Zap, Sprout, GraduationCap, Sun } from 'lucide-react';

export function ServicesSection() {
  const services = [
    {
      icon: Droplets,
      title: "Water Infrastructure",
      desc: "Delivering ₹15+ Crores in smart water treatment, intake wells, and ESRs for true water security.",
    },
    {
      icon: Settings,
      title: "Electro-Mechanical",
      desc: "Industrial HVAC and power distribution upgrades driving operational cost reductions up to 30%.",
    },
    {
      icon: Zap,
      title: "Automation & SCADA",
      desc: "ISO 9001:2015 precision control. Complete PLC networks and IoT sensors for real-time plant visibility.",
    },
    {
      icon: Sprout,
      title: "Agritech IoT",
      desc: "Smart warehouses slashing post-harvest losses by 40% via remote monitoring and climate manipulation.",
    },
    {
      icon: Sun,
      title: "Solar EPC",
      desc: "Aggressive push into off-grid solutions. Targeting 50 MW capacity by 2026 for rural empowerment.",
    },
    {
      icon: GraduationCap,
      title: "Skilled Training",
      desc: "Bridging the engineering talent gap. Training 1,000 professionals annually from ITI to MTech levels.",
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="services" className="section-padding bg-space-900 relative border-t border-white/5">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
      
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 text-white"
          >
            Capabilities & <span className="text-gradient">Divisions</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xl font-light"
          >
            A multi-disciplinary approach to engineering perfection.
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {services.map((service, i) => (
            <motion.div key={i} variants={item} className="h-full">
              <div className="glass-card p-8 h-full hover:bg-white/5 transition-colors duration-300 group relative overflow-hidden shadow-2xl">
                 
                 {/* Hover effect glow */}
                 <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                 
                 <div className="w-16 h-16 rounded-2xl bg-space-800 border border-white/10 flex items-center justify-center mb-8 group-hover:border-brand-500/40 transition-colors relative z-10 shadow-inner">
                    <service.icon className="w-8 h-8 text-brand-400 group-hover:text-brand-300 transition-colors" strokeWidth={1.5} />
                 </div>
                 
                 <h3 className="text-xl font-bold text-white mb-4 relative z-10">{service.title}</h3>
                 <p className="text-slate-400 leading-relaxed font-light relative z-10">{service.desc}</p>
                 
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

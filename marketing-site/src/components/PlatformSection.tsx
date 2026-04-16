import { motion } from 'framer-motion';
import { LayoutDashboard, Smartphone, Cpu, CloudCog } from 'lucide-react';

export function PlatformSection() {
  const features = [
    {
      icon: LayoutDashboard,
      title: "Web Admin Dashboard",
      description: "Live charts, historical analytics, comprehensive fleet overview, alert management, and remote device configuration."
    },
    {
      icon: Smartphone,
      title: "Android Mobile App",
      description: "FCM push alerts, localized site list views, and quick status controls. Giving operators full monitoring power."
    },
    {
      icon: Cpu,
      title: "ESP32 IoT Integration",
      description: "Secure MQTT via AWS IoT Core utilizing mTLS. Reliable local fallbacks and OTA firmware updates natively."
    },
    {
      icon: CloudCog,
      title: "TimescaleDB Analytics",
      description: "Hyper-optimized time-series data aggregation, robust secure APIs, encrypted at rest, and highly available."
    }
  ];

  return (
    <section id="flagship" className="section-padding bg-space-900 border-t border-white/5 relative z-20">
      
      {/* Decorative Grid Line */}
      <div className="absolute left-1/2 top-0 h-full w-px bg-white/5 -translate-x-1/2 hidden lg:block"></div>

      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center bg-accent-500/10 border border-accent-500/20 text-accent-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm"
          >
            Flagship Innovation
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white tracking-tighter"
          >
            Solar IoT Cold Storage <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-brand-400">Monitoring Platform</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xl font-light"
          >
            A truly end-to-end engineered system built on enterprise cloud infrastructure, reducing post-harvest losses by 40%.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="glass-card p-8 group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(14,165,233,0.15)] transition-all duration-300 border border-white/5 hover:border-accent-500/30"
            >
              <div className="w-14 h-14 rounded-2xl bg-space-800 border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:bg-accent-500/10 transition-colors">
                <feat.icon className="w-7 h-7 text-accent-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feat.title}</h3>
              <p className="text-slate-400 font-light leading-relaxed text-sm">{feat.description}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

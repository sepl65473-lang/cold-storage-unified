import { motion } from 'framer-motion';
import { Apple, Milk, Fish } from 'lucide-react';

export function IndustriesSection() {
  const industries = [
    {
      icon: Apple,
      name: "Fruits & Vegetables",
      desc: "Prevent premature ripening with sub-degree temperature control and CO2 monitoring.",
      image: "/images/industry_fruits_veg.png"
    },
    {
      icon: Milk,
      name: "Dairy Products",
      desc: "Maintain rigorous climate profiles essential for milk, cheese, and butter preservation.",
      image: "/images/industry_dairy.png"
    },
    {
      icon: Fish,
      name: "Fisheries",
      desc: "Ultra-low temperature logging to prevent spoilage in high-value seafood supply chains.",
      image: "/images/industry_fisheries.png"
    }
  ];

  return (
    <section id="industries" className="section-padding bg-space-900 border-t border-white/5 relative z-10">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6 text-white"
          >
            Securing <span className="text-gradient">Critical Supply Chains</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xl font-light"
          >
            Engineered to safeguard high-value, temperature-sensitive assets across specialized sectors.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {industries.map((ind, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative overflow-hidden rounded-3xl glass-card h-[400px] flex flex-col justify-end shadow-2xl transition-all"
            >
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full bg-[#0B152A]">
                <img 
                  src={ind.image} 
                  alt={ind.name} 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B152A] via-[#0B152A]/70 to-transparent"></div>
              </div>
              
              <div className="relative z-10 p-8 transform group-hover:-translate-y-4 transition-transform duration-500">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 backdrop-blur-md border border-brand-500/20 flex items-center justify-center mb-6">
                  <ind.icon className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{ind.name}</h3>
                <p className="text-slate-400 font-light leading-relaxed transform opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">{ind.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

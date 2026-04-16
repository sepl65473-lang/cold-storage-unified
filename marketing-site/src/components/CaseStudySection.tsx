import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export function CaseStudySection() {
  return (
    <section id="engineering-excellence" className="bg-space-900 relative z-10 pb-24">
      
      {/* Title Section */}
      <div className="pt-24 pb-16 px-4 md:px-8 text-center">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-white">
                Engineering Excellence
            </h2>
            <p className="text-lg md:text-xl text-slate-400 font-light max-w-3xl mx-auto">
                Specialized engineering services tailored for the needs of modern India.
            </p>
        </motion.div>
      </div>

      <div className="container-custom mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col gap-24 py-12">
          
          {/* Water Solutions (Text Left, Image Right) */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col"
            >
              <div className="text-brand-400 font-bold tracking-widest uppercase mb-4 text-sm">
                WATER SOLUTIONS
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">Civil & Water Infrastructure</h3>
              <p className="text-lg text-slate-400 font-light mb-8 leading-relaxed">
                From Water Treatment Plants (WTP) to intake wells and overhead tanks, we design and build resilient water infrastructure compliant with IRC and IS standards.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-[1.1rem] font-medium text-white"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3" /> Drinking water security expert</li>
                <li className="flex items-center text-[1.1rem] font-medium text-white"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3" /> Wastewater treatment plants</li>
                <li className="flex items-center text-[1.1rem] font-medium text-white"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3" /> IRC & IS compliant designs</li>
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-3xl overflow-hidden glass-card border border-white/10 h-[350px] md:h-[450px] shadow-2xl"
            >
              <img src="/images/water.png" alt="Water Infrastructure" className="w-full h-full object-cover brightness-75" />
            </motion.div>
          </div>

          {/* Automation (Image Left, Text Right) */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center flex-col-reverse md:flex-row">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-3xl overflow-hidden glass-card border border-white/10 h-[350px] md:h-[450px] md:order-1 order-2 shadow-2xl"
            >
              <img src="/images/automation.png" alt="Automation and SCADA" className="w-full h-full object-cover brightness-75" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:order-2 order-1"
            >
              <div className="text-emerald-400 font-bold tracking-widest uppercase mb-4 text-sm">
                CONTROL SYSTEMS
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">Industrial Automation & SCADA</h3>
              <p className="text-lg text-slate-400 font-light mb-8 leading-relaxed">
                SCADA systems, PLC integration, and real-time monitoring. We provide advanced instrumentation and control for process industries and water sectors.
              </p>
              <div className="glass-card p-6 border border-white/10 rounded-2xl shadow-inner">
                <div className="text-emerald-400 font-bold text-[1.1rem] mb-2">Energy Efficiency</div>
                <p className="text-[1.05rem] text-slate-400">Reducing operational costs by up to 30% via precision automation.</p>
              </div>
            </motion.div>
          </div>

          {/* Smart Agriculture (Text Left, Image Right) */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col"
            >
              <div className="text-amber-500 font-bold tracking-widest uppercase mb-4 text-sm">
                SMART AGRICULTURE
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">IoT-Enabled Agritech Hubs</h3>
              <p className="text-lg text-slate-400 font-light mb-8 leading-relaxed">
                Bridging the gap between technology and the field. Our agritech hubs reduce post-harvest losses by 40% using IoT climate control and smart warehousing.
              </p>
              <div className="flex gap-6 mb-6">
                <div className="glass-card p-5 border border-white/10 rounded-2xl w-44 shadow-inner">
                  <div className="text-3xl md:text-4xl font-black mb-2 text-white">20+</div>
                  <div className="text-[0.8rem] font-bold text-white/60 uppercase tracking-wider">Villages Enabled</div>
                </div>
                <div className="glass-card p-5 border border-white/10 rounded-2xl w-44 shadow-inner">
                  <div className="text-3xl md:text-4xl font-black mb-2 text-white">500+</div>
                  <div className="text-[0.8rem] font-bold text-white/60 uppercase tracking-wider">Farmers Supported</div>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-3xl overflow-hidden glass-card border border-white/10 h-[350px] md:h-[450px] shadow-2xl"
            >
              <img src="/images/agritech.png" alt="Agritech Hub" className="w-full h-full object-cover brightness-75" />
            </motion.div>
          </div>

        </div>
      </div>

      {/* Project Gallery Grid */}
      <div className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black inline-block text-white">
            Project Gallery
          </h2>
          <div className="mt-4 w-16 h-[3px] bg-brand-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { img: '/images/water.png', title: 'Water Infrastructure' },
            { img: '/images/solar.png', title: 'Solar Off-grid Pumping' },
            { img: '/images/training.png', title: 'Training Institute' },
            { img: '/images/automation.png', title: 'SCADA Integration' },
            { img: '/images/agritech.png', title: 'Smart Warehousing' },
            { img: '/images/industry_dairy.png', title: 'Dairy Logistics' },
            { img: '/images/industry_fisheries.png', title: 'Fisheries Cold Chain' },
            { img: '/images/industry_fruits_veg.png', title: 'Horticulture Hub' },
            { img: '/images/hero_solar_refrigeration.png', title: 'Solar Refrigeration' }
          ].map((item, i) => (
            <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative h-[250px] rounded-[1.5rem] overflow-hidden glass-card group border border-white/10 shadow-2xl"
            >
              <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-space-900/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[1.05rem] font-bold text-white tracking-wide">
                    {item.title}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  );
}

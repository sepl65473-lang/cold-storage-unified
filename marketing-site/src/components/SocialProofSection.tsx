import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

export function SocialProofSection() {
  const testimonials = [
    {
      quote: "The Smaatech platform completely transformed how we manage our 5 remote cold storage units. The early warning alerts saved an entire ₹2L inventory from spoiling during a grid failure last month.",
      name: "Rajesh K.",
      role: "Operations Director",
      company: "Odisha Agro Logistics",
      stars: 5
    },
    {
      quote: "We used to rely on manual logbooks. Now, our temperature compliance reports are automatically generated for food safety audits. The web dashboard is incredibly responsive and intuitive.",
      name: "Priyanka S.",
      role: "Quality Assurance Manager",
      company: "Fresh Harvest Co.",
      stars: 5
    },
    {
      quote: "Given the frequent power fluctuations, the solar integration and battery monitoring on the platform is a game-changer. It gives us true peace of mind.",
      name: "Amit M.",
      role: "Facility Owner",
      company: "Coastal Fisheries Storage",
      stars: 5
    }
  ];

  return (
    <section className="section-padding bg-space-900 border-t border-white/5 relative z-10 overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-accent-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6 text-white"
          >
            Trusted by <span className="text-gradient">Industry Leaders</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {testimonials.map((testimonial, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="glass-card p-8 md:p-10 hover:-translate-y-2 transition-transform duration-500 shadow-2xl"
            >
              <div className="flex mb-6">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-400 fill-accent-400" />
                ))}
              </div>
              <Quote className="w-10 h-10 text-white/20 mb-6" />
              <p className="text-slate-400 italic mb-8 leading-relaxed font-light text-lg">"{testimonial.quote}"</p>
              
              <div className="border-t border-white/10 pt-6 mt-auto">
                <h4 className="font-bold text-white text-lg">{testimonial.name}</h4>
                <p className="text-sm font-medium text-slate-400">{testimonial.role}, <span className="text-brand-400">{testimonial.company}</span></p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partners Strip */}
        <div className="border-y border-white/5 py-12 text-center bg-white/5 backdrop-blur-sm rounded-3xl">
           <p className="text-slate-400 uppercase tracking-widest text-sm font-bold mb-8 opacity-70">Powering infrastructure alongside leading technology partners</p>
           <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-60">
             <div className="text-2xl font-black font-sans text-white">AWS IoT</div>
             <div className="text-2xl font-black font-serif italic text-white">Schneider</div>
             <div className="text-2xl font-black font-mono text-white">Timescale</div>
             <div className="text-2xl font-black uppercase text-white tracking-widest">Espressif</div>
           </div>
        </div>

      </div>
    </section>
  );
}

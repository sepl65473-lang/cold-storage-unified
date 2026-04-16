import { motion } from 'framer-motion';
import { BellRing, ShieldCheck, MapPin } from 'lucide-react';

export function MobileAppSection() {
  return (
    <section id="mobile-app" className="section-padding bg-space-900 relative z-10 border-t border-white/5 overflow-hidden">
      {/* Abstract Tech Background */}
      <div className="absolute top-0 right-0 w-full h-full opacity-10 select-none pointer-events-none">
        <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform scale-150 translate-x-1/4 -translate-y-1/4">
          <defs>
             <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                <stop offset="100%" stopColor="transparent" />
             </linearGradient>
          </defs>
          <path d="M0,500 C200,300 400,700 600,500 C800,300 1000,500 1000,500 L1000,1000 L0,1000 Z" fill="url(#grad)" />
          <path d="M0,600 C300,400 500,800 1000,400 L1000,1000 L0,1000 Z" fill="url(#grad)" transform="scale(1.1) translate(-50, -50)" opacity="0.5"/>
        </svg>
      </div>
      
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 relative flex justify-center lg:justify-end"
          >
            {/* Phone Mockup Glow */}
            <div className="absolute inset-0 bg-brand-500/10 rounded-full blur-[100px] transform scale-75"></div>
            
            <div className="relative mx-auto lg:mx-0 w-full max-w-[320px] aspect-[9/19] rounded-[3rem] border-[12px] border-black shadow-2xl overflow-hidden bg-black">
              {/* Fake phone notch */}
              <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20">
                <div className="w-32 h-6 bg-black rounded-b-3xl"></div>
              </div>
              
              <img 
                src="/images/mobile_app_mockup.png" 
                alt="Solar IoT Cold Storage Mobile App" 
                className="w-full h-full object-cover relative z-10 opacity-90 brightness-75"
              />
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tighter">
              Stay in Control <br/><span className="text-gradient">Wherever You Are.</span>
            </h2>
            <p className="text-slate-400 text-xl font-light mb-10 leading-relaxed max-w-lg">
              Designed specifically for operators on the move. The Smaatech Android app brings the critical power of the admin dashboard directly to your smartphone.
            </p>

            <div className="space-y-8">
              {[
                { icon: BellRing, title: "Real-time Push Notifications", desc: "Instant Firebase Cloud Messaging (FCM) alerts for thermal breaches and offline connectivity drops." },
                { icon: MapPin, title: "Site Overview", desc: "Quickly check the status of remote cold rooms distributed across different regions from one screen." },
                { icon: ShieldCheck, title: "Secure Access", desc: "Organization-only access secured via Multi-Factor Authentication (MFA) and encrypted tokens." }
              ].map((item, i) => (
                <div key={i} className="flex group">
                  <div className="w-14 h-14 rounded-2xl bg-space-800 border border-white/10 flex items-center justify-center mr-6 flex-shrink-0 shadow-inner group-hover:border-brand-500/30 transition-colors">
                    <item.icon className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-slate-400 font-light leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

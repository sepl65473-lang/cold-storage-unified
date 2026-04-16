import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Server, Droplets, ShieldCheck } from 'lucide-react';
import { config } from '../config';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const portals = [
    {
      name: "Solar IoT Cold Storage",
      desc: "Admin Dashboard & Device Management",
      icon: Server,
      url: config.platformDashboardUrl,
      active: true
    },
    {
      name: "Water Infrastructure SCADA",
      desc: "Real-time Pumping & Distribution Control",
      icon: Droplets,
      url: "#",
      active: false,
      availableSoon: "Deployment Q3 2026"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg glass-card relative overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10 bg-space-950">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                  <Lock className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Client Portals</h3>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto relative z-10 bg-space-900">
              <p className="text-slate-400 mb-6 font-light">
                Select your authorized organization platform. You will be redirected to the secure login gateway.
              </p>
              
              <div className="space-y-4">
                {portals.map((portal, i) => (
                  <a 
                    key={i}
                    href={portal.active ? portal.url : '#'}
                    className={`block p-4 rounded-xl border transition-all duration-300 ${
                      portal.active 
                        ? 'bg-white/5 border-white/10 hover:border-brand-500/50 hover:bg-white/10 group cursor-pointer shadow-2xl' 
                        : 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        portal.active ? 'bg-brand-500/10 text-brand-400 group-hover:scale-110 transition-transform' : 'bg-white/10 text-slate-500'
                      }`}>
                        <portal.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white flex items-center">
                          {portal.name}
                          {!portal.active && (
                            <span className="ml-3 text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-slate-400">
                              {portal.availableSoon || 'Offline'}
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-slate-400 mt-1">{portal.desc}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-xs text-slate-500 font-medium flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-brand-500" />
                  Secured via 256-bit encryption and MFA policies.
                </p>
              </div>
            </div>
            
            {/* Background Decor */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

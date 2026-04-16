import { Twitter, Linkedin } from 'lucide-react';
import seplLogo from '../assets/sepl-logo.png';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-space-950 border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-brand-500/5 blur-[100px] pointer-events-none"></div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <img src={seplLogo} alt="SEPL Logo" className="h-8 w-auto object-contain" />
              <span className="font-bold text-2xl tracking-tight text-white">
                Smaatech<span className="text-brand-500">.</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed font-light pr-4 mb-8">
              Architecting the infrastructure of tomorrow. Smaatech Group delivers highly engineered solutions across heavy civil, automation, and intelligent agritech ecosystems.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-white/5 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-white/5 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-white/5 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Divisions</h4>
            <ul className="space-y-4">
              {['Water Infrastructure', 'Electro-Mechanical', 'Industrial Automation', 'Solar EPC', 'Agritech IoT'].map((item) => (
                <li key={item}>
                  <a href="#services" className="text-slate-400 hover:text-brand-400 font-light transition-colors text-sm">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Platform</h4>
            <ul className="space-y-4">
              {['Features overview', 'Android Application', 'Hardware Specs', 'Security Architecture', 'API Documentation'].map((item) => (
                <li key={item}>
                  <a href="#flagship" className="text-slate-400 hover:text-brand-400 font-light transition-colors text-sm">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="lg:col-span-3">
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Stay Synced</h4>
            <p className="text-slate-400 text-sm font-light leading-relaxed mb-4">
              Subscribe to our engineering debriefs for updates on infrastructure technology and platform releases.
            </p>
            <form className="relative group">
              <input 
                type="email" 
                placeholder="Secure email link..." 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors placeholder-white/20 font-light"
              />
              <button 
                type="button" 
                className="absolute right-1 top-1 bg-brand-500 text-slate-900 rounded-md px-3 py-1.5 text-sm font-bold hover:bg-brand-400 transition-colors"
              >
                Sync
              </button>
            </form>
          </div>
          
        </div>
        
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm font-light">
            &copy; {currentYear} Smaatech Engineering Group. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm font-light">
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Privacy Protocol</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

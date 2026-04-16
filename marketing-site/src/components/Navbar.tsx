import { useState, useEffect } from 'react';
import { Menu, X, Component } from 'lucide-react';

import seplLogo from '../assets/sepl-logo.png';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  openLoginModal: () => void;
}

export function Navbar({ currentView, setView, openLoginModal }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  type NavLink = { name: string; href: string; isAnchor: boolean; action?: () => void };
  const navLinks: NavLink[] = currentView === 'home' ? [
    { name: 'Home', href: '#home', isAnchor: true },
    { name: 'About', href: '#about', isAnchor: true },
    { name: 'Divisions', href: '#services', isAnchor: true },
  ] : [
    { name: '← Back to Home', href: '#', isAnchor: false, action: () => { setView('home'); window.scrollTo(0, 0); } },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav py-3' : 'bg-transparent py-5'}`}>
      <div className="container-custom">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => { setView('home'); window.scrollTo(0,0); }}>
            <img src={seplLogo} alt="SEPL Logo" className="h-10 w-auto object-contain" />
            <span className="font-bold text-2xl tracking-tight text-white">
              Smaatech<span className="text-brand-500">.</span>
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center justify-center space-x-8 flex-1 px-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (!link.isAnchor && link.action) {
                    e.preventDefault();
                    link.action();
                  }
                }}
                className="text-slate-400 hover:text-white font-medium text-sm transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden lg:flex items-center space-x-4">
             <button 
               onClick={() => { setView('projects'); window.scrollTo(0,0); }}
               className={`btn-secondary text-sm px-5 py-2.5 flex items-center ${currentView === 'projects' ? 'border-brand-500/50 bg-brand-500/10 text-brand-300' : ''}`}
             >
              <Component className="w-4 h-4 mr-2" />
              Public Projects
            </button>
            
             <button 
               onClick={openLoginModal}
               className="btn-primary text-sm px-6 py-2.5"
             >
              Client Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-space-950/95 backdrop-blur-2xl z-40 transition-transform duration-300 lg:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'} pt-24 px-6`}>
         <div className="flex flex-col space-y-6 text-center h-full">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-2xl font-bold text-slate-400 hover:text-white transition-colors"
                onClick={(e) => {
                  setIsOpen(false);
                  if (!link.isAnchor && link.action) {
                    e.preventDefault();
                    link.action();
                  }
                }}
              >
                {link.name}
              </a>
            ))}
            
            <div className="pt-8 border-t border-white/10 mt-8 space-y-4">
              <button 
                onClick={() => { setView('projects'); setIsOpen(false); window.scrollTo(0,0); }}
                className="btn-secondary w-full justify-center text-lg"
              >
                Public Projects
              </button>
              
              <button 
                onClick={() => { openLoginModal(); setIsOpen(false); }}
                className="btn-primary w-full justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] text-lg"
              >
                Client Login
              </button>
            </div>
         </div>
      </div>
    </nav>
  );
}

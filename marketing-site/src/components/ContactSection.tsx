import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, MapPin, Mail, Phone, ArrowUpRight, X } from 'lucide-react';
import { config } from '../config';

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch(config.contactFormEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Transmission failed');

      setStatus('success');
      setFormData({ name: '', email: '', company: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <section id="contact" className="section-padding bg-space-900 border-t border-white/5 relative z-10 overflow-hidden">

      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tighter"
          >
            Initiate a <span className="text-gradient">Partnership</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xl font-light"
          >
            Whether it's a 50MW solar plant or an IoT-enabled warehouse, our engineering teams are ready to architect your next leap forward.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 max-w-6xl mx-auto">

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="glass-card p-8 group hover:border-brand-500/30 transition-colors shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-8">Corporate Headquarters</h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-brand-400 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Bhubaneswar, Odisha</h4>
                  </div>
                </div>

                <div className="w-full h-px bg-white/10"></div>

                <div className="flex items-center group/link cursor-pointer">
                  <Mail className="w-6 h-6 text-brand-400 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-white group-hover/link:text-brand-400 transition-colors">Info@smaatechengineering.com</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover/link:text-brand-400 transition-colors opacity-0 group-hover/link:opacity-100" />
                </div>

                <div className="flex items-center group/link cursor-pointer">
                  <Phone className="w-6 h-6 text-brand-400 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-white group-hover/link:text-brand-400 transition-colors">+91 (674) 662-1100</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover/link:text-brand-400 transition-colors opacity-0 group-hover/link:opacity-100" />
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-brand-500/5 border border-brand-500/10">
              <h4 className="font-bold text-white mb-2 italic">Rapid Engineering Inquiry</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-light">Response times for project architecting typically range between 24-48 business hours.</p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl rounded-full"></div>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <input
                      name="name"
                      required
                      type="text"
                      placeholder="Jane Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                    <input
                      name="email"
                      required
                      type="email"
                      placeholder="jane@company.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Organization / Department</label>
                  <input
                    name="organization"
                    type="text"
                    placeholder="Engineering Division"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Project Requirements</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="Describe your infrastructure needs or tech specifications..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all resize-none placeholder:text-white/20"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_-10px_rgba(16,185,129,0.3)]"
                >
                  {status === 'submitting' ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Transmit Inquiry
                      <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>

                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400 font-bold"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Message transmitted successfully.
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-bold"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Transmission failed. Please try again.
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

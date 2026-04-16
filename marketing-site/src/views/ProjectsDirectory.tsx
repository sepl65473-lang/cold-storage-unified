import { motion } from 'framer-motion';
import { ArrowRight, ThermometerSnowflake, Droplets, Building2 } from 'lucide-react';

interface ProjectsDirectoryProps {
  setView: (view: string) => void;
}

export function ProjectsDirectory({ setView }: ProjectsDirectoryProps) {
  const projects = [
    {
      id: "cold-storage",
      title: "Solar IoT Cold Storage Platform",
      category: "Agritech IoT",
      desc: "An end-to-end engineered system built on enterprise cloud infrastructure, reducing post-harvest losses by 40%.",
      image: "/images/agritech.png",
      icon: ThermometerSnowflake,
      available: true
    },
    {
      id: "water-purification",
      title: "Water Purification",
      category: "Infrastructure",
      desc: "Scalable solar-powered water filtration systems providing clean drinking water to remote communities.",
      image: "/images/water.png",
      icon: Droplets,
      available: false
    },
    {
      id: "automation",
      title: "Smart Factory Automation",
      category: "Electro-Mechanical",
      desc: "Full conveyor and robotic arm PLC integration for industrial packaging facilities.",
      image: "/images/automation.png",
      icon: Building2,
      available: false
    }
  ];

  return (
    <div className="pt-32 pb-24 min-h-screen bg-space-900 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container-custom relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-16"
        >
          <div className="inline-block bg-brand-500/10 border border-brand-500/20 text-brand-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            Public Directory
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            Detailed <span className="text-gradient">Case Studies</span>
          </h1>
          <p className="text-xl text-slate-400 font-light leading-relaxed">
            Explore deep dives into our flagship infrastructure and technology deployments across various sectors.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              onClick={() => {
                if (project.available) {
                  setView('project-cold-storage');
                  window.scrollTo(0,0);
                }
              }}
              className={`glass-card group overflow-hidden flex flex-col h-full ${
                project.available 
                  ? 'cursor-pointer hover:border-brand-500/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300' 
                  : 'opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-space-900 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-space-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                  {project.category}
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <div className="w-12 h-12 rounded-xl bg-space-800 border border-white/10 flex items-center justify-center mb-6 -mt-14 relative z-10 shadow-xl group-hover:border-brand-500/50 group-hover:text-brand-400 transition-colors">
                  <project.icon className="w-6 h-6 text-white group-hover:text-brand-400 transition-colors" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{project.title}</h3>
                <p className="text-slate-400 font-light leading-relaxed flex-grow">
                  {project.desc}
                </p>
                
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  {project.available ? (
                    <span className="text-brand-400 font-bold flex items-center group-hover:text-brand-300 transition-colors">
                      View Platform Details <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  ) : (
                    <span className="text-slate-500 text-sm uppercase tracking-widest font-bold">
                      Case Study Coming Soon
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

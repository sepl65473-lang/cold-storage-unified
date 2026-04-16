import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';

// Views
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { ContactSection } from './components/ContactSection';
import { CaseStudySection } from './components/CaseStudySection';

import { ProjectsDirectory } from './views/ProjectsDirectory';
import { ProjectColdStorage } from './views/ProjectColdStorage';

function App() {
  const [view, setView] = useState<string>('home');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-space-900 text-white font-sans selection:bg-brand-500 selection:text-white">
      <Navbar 
        currentView={view} 
        setView={setView} 
        openLoginModal={() => setIsLoginModalOpen(true)} 
      />
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      
      <main className="flex-grow">
        {view === 'home' && (
          <div className="animate-in fade-in duration-500">
            <Hero />
            <AboutSection />
            <ServicesSection />
            <CaseStudySection />
            <ContactSection />
          </div>
        )}
        
        {view === 'projects' && (
          <div className="animate-in fade-in duration-500">
            <ProjectsDirectory setView={setView} />
          </div>
        )}
        
        {view === 'project-cold-storage' && (
          <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <ProjectColdStorage setView={setView} />
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;

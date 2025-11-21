import React, { useState, useEffect } from 'react';
import LandingDesktop from './components/LandingDesktop';
import LandingMobile from './components/LandingMobile';

const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <LandingMobile /> : <LandingDesktop />;
};

export default App;

import React, { useState } from 'react';
import LandingDesktop from './components/LandingDesktop';
import LandingMobile from './components/LandingMobile';
import HeroScene from './components/HeroScene';
import HeroTestScene from './components/HeroTestScene';
import TagViewer from './components/TagViewer';
import RulerViewer from './components/RulerViewer';
import PenViewer from './components/PenViewer';
import EraserViewer from './components/EraserViewer';

const VIEWS = [
  { id: 'landing-desktop', label: 'Landing 桌面' },
  { id: 'landing-mobile', label: 'Landing 移动' },
  { id: 'hero', label: 'Hero' },
  { id: 'hero-test', label: 'Hero 测试' },
  { id: 'tag', label: '标签 Viewer' },
  { id: 'ruler', label: '尺子 Viewer' },
  { id: 'pen', label: '铅笔 Viewer' },
  { id: 'eraser', label: '橡皮 Viewer' },
];

const App = () => {
  const [view, setView] = useState('landing-desktop');

  const renderView = () => {
    switch (view) {
      case 'landing-mobile':
        return <LandingMobile />;
      case 'hero':
        return <HeroScene />;
      case 'hero-test':
        return <HeroTestScene />;
      case 'tag':
        return <TagViewer />;
      case 'ruler':
        return <RulerViewer />;
      case 'pen':
        return <PenViewer />;
      case 'eraser':
        return <EraserViewer />;
      case 'landing-desktop':
      default:
        return <LandingDesktop />;
    }
  };

  return (
    <div>
      <div className="view-switcher">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={view === item.id ? 'active' : ''}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {renderView()}
    </div>
  );
};

export default App;

import React from 'react';
import Toolbar from './Toolbar';

// Top HUD with brand/nav + toolbar; content is kept minimal to match original HTML.
const Hud = ({ iconRefs, downloadLabel = 'Download' }) => (
  <div className="hud-layer">
    <div className="nav-header">
      <div className="brand">LIMITLESS</div>
      <div className="menu-items">
        <span>Product</span>
        <span>Solutions</span>
        <span>Pricing</span>
        <span style={{ color: 'var(--text-main)', borderBottom: '1px solid currentColor' }}>{downloadLabel}</span>
      </div>
    </div>
    <Toolbar ref={iconRefs} />
  </div>
);

export default Hud;

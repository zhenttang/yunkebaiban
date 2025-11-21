import React from 'react';

// Top HUD with brand/nav.
const Hud = ({ downloadLabel = '下载' }) => (
  <div className="hud-layer">
    <div className="nav-header">
      <div className="brand">云科白板</div>
      <div className="menu-items">
        <span>产品</span>
        <span>解决方案</span>
        <span>定价</span>
        <span style={{ color: 'var(--text-main)', borderBottom: '1px solid currentColor' }}>{downloadLabel}</span>
      </div>
    </div>
  </div>
);

export default Hud;

import React from 'react';

const TOOLBAR_ICONS = [
  { id: 'pen' },
  { id: 'eraser' },
  { id: 'ruler' },
  { id: 'tag' },
  { id: 'cta' },
];

// Minimal toolbar used across landing variants.
const Toolbar = React.forwardRef(({ initialActive = 0 }, ref) => (
  <div className="toolbar-mockup">
    {TOOLBAR_ICONS.map((icon, index) => (
      <div
        key={icon.id}
        className={`tool-icon${initialActive === index ? ' active' : ''}`}
        ref={(el) => {
          if (!ref || !ref.current) return;
          ref.current[index] = el;
        }}
        style={icon.id === 'cta' ? { borderRadius: 100, width: 40, background: 'var(--accent)' } : undefined}
      />
    ))}
  </div>
));

Toolbar.displayName = 'Toolbar';

export default Toolbar;

import React from 'react';

const FeatureCard = React.forwardRef(({ card }, ref) => {
  const alignStyle =
    card.align === 'right'
      ? { alignSelf: 'flex-end', textAlign: 'right' }
      : card.align === 'center'
        ? { alignSelf: 'center', textAlign: 'center' }
        : {};

  return (
    <div
      className={`feature-card${card.dark ? ' dark-mode' : ''}`}
      ref={ref}
      style={{ ...alignStyle, ...card.style, maxWidth: card.align === 'left' ? 480 : undefined }}
    >
      {card.tag ? (
        <div className="tag" style={card.dark ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : undefined}>
          {card.tag}
        </div>
      ) : null}
      <div className="headline">
        {card.headline}
        {card.annotation && (
          <span className="annotation" style={{
            position: 'absolute',
            top: '-20px',
            right: '-40px',
            fontFamily: '"Ma Shan Zheng", cursive',
            fontSize: '24px',
            color: '#2563eb',
            transform: 'rotate(-10deg)',
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}>
            {card.annotation} ↗
          </span>
        )}
      </div>
      <div className="subtext" style={card.dark ? { color: '#9CA3AF' } : undefined}>
        {card.subtext}
      </div>
      {card.cta ? <div className="cta-pill">{card.cta}</div> : null}
    </div>
  );
});

FeatureCard.displayName = 'FeatureCard';

export default FeatureCard;

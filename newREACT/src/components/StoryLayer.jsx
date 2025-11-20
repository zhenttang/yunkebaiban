import React from 'react';
import FeatureCard from './FeatureCard';

const StoryLayer = ({ cards, cardRefs }) => (
  <div className="story-layer">
    {cards.map((card, idx) => (
      <FeatureCard
        key={card.id}
        card={card}
        ref={(el) => {
          if (!cardRefs || !cardRefs.current) return;
          cardRefs.current[idx] = el;
        }}
      />
    ))}
  </div>
);

export default StoryLayer;

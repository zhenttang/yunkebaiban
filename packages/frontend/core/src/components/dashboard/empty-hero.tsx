import type { ReactNode } from 'react';

import { EmptyHeroIllustration } from './empty-hero-illustration';
import * as styles from './empty-hero.css';

export interface EmptyHeroProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export const EmptyHero = ({ title, description, actions }: EmptyHeroProps) => {
  return (
    <section className={styles.container} aria-label="空状态">
      <div className={styles.gridBackground} />
      <EmptyHeroIllustration />
      <div className={styles.content}>
        {title ? <h2 className={styles.title}>{title}</h2> : null}
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
        {actions}
      </div>
    </section>
  );
};


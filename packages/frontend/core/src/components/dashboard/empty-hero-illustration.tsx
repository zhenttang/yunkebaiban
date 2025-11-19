import * as styles from './empty-hero.css';

export const EmptyHeroIllustration = () => {
  return (
    <div className={styles.illustration} aria-hidden="true">
      <div className={styles.centerCircle} />
      <div className={styles.cardLeft}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 12,
            backgroundColor: '#e0e7ff',
            marginBottom: 8,
          }}
        />
        <div
          style={{
            width: 64,
            height: 6,
            borderRadius: 999,
            backgroundColor: '#e5e7eb',
            marginBottom: 4,
          }}
        />
        <div
          style={{
            width: 48,
            height: 6,
            borderRadius: 999,
            backgroundColor: '#e5e7eb',
          }}
        />
      </div>
      <div className={styles.cardRight}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '999px',
              backgroundColor: '#fb7185',
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '999px',
              backgroundColor: '#facc15',
            }}
          />
        </div>
        <div
          style={{
            width: '100%',
            height: 52,
            borderRadius: 12,
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            marginBottom: 10,
          }}
        />
        <div
          style={{
            display: 'grid',
            rowGap: 4,
          }}
        >
          <div
            style={{
              width: '100%',
              height: 6,
              borderRadius: 999,
              backgroundColor: '#e5e7eb',
            }}
          />
          <div
            style={{
              width: '72%',
              height: 6,
              borderRadius: 999,
              backgroundColor: '#e5e7eb',
            }}
          />
        </div>
      </div>
      <div
        className={styles.particle}
        style={{
          width: 8,
          height: 8,
          backgroundColor: '#6366f1',
          top: 40,
          left: '52%',
        }}
      />
      <div
        className={styles.particle}
        style={{
          width: 10,
          height: 10,
          backgroundColor: '#facc15',
          bottom: 80,
          right: 40,
        }}
      />
    </div>
  );
};


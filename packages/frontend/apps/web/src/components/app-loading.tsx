import { Loading } from '@yunke/component/ui/loading';
import * as React from 'react';
import * as styles from './app-loading.css';

export const AppLoading: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.loadingWrapper}>
        <Loading size={48} speed={1.2} />
      </div>
      <div className={styles.textContainer}>
        <div className={styles.title}>应用初始化中...</div>
        <div className={styles.hint}>请稍候，正在加载应用资源</div>
      </div>
    </div>
  );
};
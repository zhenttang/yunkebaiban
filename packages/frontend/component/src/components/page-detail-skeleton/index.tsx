import { Trans, useI18n } from '@yunke/i18n';
import clsx from 'clsx';
import { useCallback } from 'react';

import { Button } from '../../ui/button';
import { Loading } from '../../ui/loading';
import * as styles from './index.css';

export const EditorLoading = ({
  longerLoading = false,
}: {
  longerLoading?: boolean;
}) => {
  const t = useI18n();
  const reloadPage = useCallback(() => {
    document.location.reload();
  }, []);
  return (
    <div className={styles.blockSuiteEditorStyle}>
      {/* 用CSS SVG替代PNG图片 - 从126KB减少到<1KB */}
      <svg
        className={styles.illustration}
        width="300"
        height="200"
        viewBox="0 0 300 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 背景点点 */}
        <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="2" fill="currentColor" opacity="0.1"/>
        </pattern>
        <rect width="300" height="200" fill="url(#dots)"/>

        {/* 文档图标 */}
        <g transform="translate(100, 40)">
          <rect x="0" y="0" width="100" height="120" rx="8" fill="white"
                filter="drop-shadow(0 4px 12px rgba(0,0,0,0.1))"/>
          <rect x="15" y="20" width="40" height="8" rx="4" fill="currentColor" opacity="0.2"/>
          <rect x="15" y="40" width="70" height="8" rx="4" fill="currentColor" opacity="0.2"/>
          <rect x="15" y="60" width="60" height="8" rx="4" fill="currentColor" opacity="0.2"/>
          <rect x="15" y="80" width="50" height="8" rx="4" fill="currentColor" opacity="0.2"/>
        </g>
      </svg>
      {longerLoading ? (
        <div className={styles.content} data-longer-loading={true}>
          <div>
            <div className={styles.text} data-longer-loading={true}>
              {t['com.yunke.error.loading-timeout-error']()}
            </div>
            <div className={styles.text} data-longer-loading={true}>
              <Trans
                i18nKey="com.yunke.error.contact-us"
                components={{
                  1: (
                    <a
                      style={{ color: 'var(--yunke-primary-color)' }}
                      href="https://community.yunke.pro"
                      target="__blank"
                    />
                  ),
                }}
              />
            </div>
          </div>
          <Button
            size="large"
            className={clsx(
              BUILD_CONFIG.isMobileEdition
                ? styles.mobileActionButton
                : styles.actionButton
            )}
            contentClassName={clsx(
              BUILD_CONFIG.isMobileEdition
                ? styles.mobileActionContent
                : styles.actionContent
            )}
            onClick={reloadPage}
            variant="primary"
          >
            {t['com.yunke.error.reload']()}
          </Button>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.title}>
            <Loading size={20} className={styles.loadingIcon} />
            {t['com.yunke.loading']()}
          </div>
          <div className={styles.text}>
            {t['com.yunke.loading.description']()}
          </div>
        </div>
      )}
    </div>
  );
};

export const PageDetailLoading = () => {
  return (
    <div className={styles.pageDetailSkeletonStyle}>
      <EditorLoading />
    </div>
  );
};

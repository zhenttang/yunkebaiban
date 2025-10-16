import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { settingHeader, settingHeaderBeta } from './share.css';

interface SettingHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  beta?: boolean;
}

export const SettingHeader = forwardRef<HTMLDivElement, SettingHeaderProps>(
  ({ title, subtitle, beta, ...otherProps }, ref) => {
    return (
      <div ref={ref} className={settingHeader} {...otherProps}>
        <div className="title">
          {title}
          {beta ? <div className={settingHeaderBeta}>测试版</div> : null}
        </div>
        {subtitle ? <div className="subtitle">{subtitle}</div> : null}
      </div>
    );
  }
);

SettingHeader.displayName = 'SettingHeader';

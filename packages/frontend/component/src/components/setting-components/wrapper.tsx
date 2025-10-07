import clsx from 'clsx';
import type { PropsWithChildren, ReactNode } from 'react';

import { wrapper, wrapperDisabled } from './share.css';

interface SettingWrapperProps {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  testId?: string;
}

export const SettingWrapper = ({
  id,
  title,
  description,
  children,
  disabled,
  testId,
}: PropsWithChildren<SettingWrapperProps>) => {
  return (
    <div
      id={id}
      className={clsx(wrapper, disabled && wrapperDisabled)}
      data-testid={testId}
      aria-disabled={disabled}
    >
      {title ? <div className="title">{title}</div> : null}
      {description ? <div className="description">{description}</div> : null}
      {children}
    </div>
  );
};

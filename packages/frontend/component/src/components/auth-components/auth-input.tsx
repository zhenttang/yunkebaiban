import clsx from 'clsx';
import { useId, type ReactNode } from 'react';

import type { InputProps } from '../../ui/input';
import { Input } from '../../ui/input';
import * as styles from './share.css';
export type AuthInputProps = InputProps & {
  label?: string;
  error?: boolean;
  errorHint?: ReactNode;
  onEnter?: () => void;
};
export const AuthInput = ({
  label,
  error,
  errorHint,
  onEnter,
  className,
  ...inputProps
}: AuthInputProps) => {
  const generatedId = useId();
  const inputId = inputProps.id ?? generatedId;

  return (
    <div
      className={clsx(styles.authInputWrapper, {
        'with-hint': !!errorHint,
      })}
    >
      {label ? <label htmlFor={inputId}>{label}</label> : null}
      <Input
        className={clsx(className)}
        size="extraLarge"
        status={error ? 'error' : 'default'}
        onEnter={onEnter}
        id={inputId}
        {...inputProps}
      />
      {error && errorHint ? (
        <div className={styles.authInputError}>{errorHint}</div>
      ) : null}
    </div>
  );
};

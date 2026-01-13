import { notify } from '@yunke/component';
import {
  AuthContainer,
  AuthContent,
  AuthFooter,
  AuthHeader,
  AuthInput,
} from '@yunke/component/auth-components';
import { Button } from '@yunke/component/ui/button';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { AuthService } from '@yunke/core/modules/cloud';
import type { AuthSessionStatus } from '@yunke/core/modules/cloud/entities/session';
import { Unreachable } from '@yunke/env/constant';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useState } from 'react';

import type { SignInState } from '.';
import { Back } from './back';
import * as styles from './style.css';

export const SignInWithPasswordStep = ({
  state,
  changeState,
  onAuthenticated,
}: {
  state: SignInState;
  changeState: Dispatch<SetStateAction<SignInState>>;
  onAuthenticated?: (status: AuthSessionStatus) => void;
}) => {
  const t = useI18n();
  const authService = useService(AuthService);

  const email = state.email;

  if (!email) {
    throw new Unreachable();
  }

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const loginStatus = useLiveData(authService.session.status$);

  useEffect(() => {
    if (loginStatus === 'authenticated') {
      notify.success({
        title: t['com.yunke.auth.toast.title.signed-in'](),
        message: t['com.yunke.auth.toast.message.signed-in'](),
      });
    }
    onAuthenticated?.(loginStatus);
  }, [loginStatus, onAuthenticated, t]);

  const onSignIn = useAsyncCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await authService.signInPassword({
        email,
        password,
        verifyToken: null, // 移除人机检测
        challenge: null,   // 移除人机检测
      });
    } catch (err) {
      console.error(err);
      setPasswordError(true);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    authService,
    email,
    password,
  ]);

  const sendMagicLink = useCallback(() => {
    changeState(prev => ({ ...prev, step: 'signInWithEmail' }));
  }, [changeState]);

  return (
    <AuthContainer>
      <AuthHeader
        title={t['com.yunke.auth.sign.in']()}
      />

      <AuthContent>
        <AuthInput
          label={t['com.yunke.settings.email']()}
          disabled={true}
          value={email}
        />
        <AuthInput
          autoFocus
          data-testid="password-input"
          label={t['com.yunke.auth.password']()}
          value={password}
          type="password"
          onChange={useCallback((value: string) => {
            setPassword(value);
          }, [])}
          error={passwordError}
          errorHint={t['com.yunke.auth.password.error']()}
          onEnter={onSignIn}
        />
        <div className={styles.passwordButtonRow}>
          <a
            data-testid="send-magic-link-button"
            className={styles.linkButton}
            onClick={sendMagicLink}
          >
            {t['com.yunke.auth.sign.auth.code.send-email.sign-in']()}
          </a>
        </div>
        <Button
          data-testid="sign-in-button"
          variant="primary"
          size="extraLarge"
          style={{ width: '100%' }}
          disabled={isLoading}
          onClick={onSignIn}
        >
          {t['com.yunke.auth.sign.in']()}
        </Button>
      </AuthContent>
      <AuthFooter>
        <Back changeState={changeState} />
      </AuthFooter>
    </AuthContainer>
  );
};

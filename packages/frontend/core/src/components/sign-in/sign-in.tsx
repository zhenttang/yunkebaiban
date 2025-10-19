import { Button, notify } from '@yunke/component';
import {
  AuthContainer,
  AuthContent,
  AuthFooter,
  AuthHeader,
  AuthInput,
} from '@yunke/component/auth-components';
import { OAuth } from '@yunke/core/components/affine/auth/oauth';
import { useAsyncCallback } from '@yunke/core/components/hooks/affine-async-hooks';
import { AuthService, ServerService } from '@yunke/core/modules/cloud';
import type { AuthSessionStatus } from '@yunke/core/modules/cloud/entities/session';
// import { ServerDeploymentType } from '@yunke/graphql';
import { ServerDeploymentType } from '../../modules/cloud/types';
import { Trans, useI18n } from '@yunke/i18n';
import {
  ArrowRightBigIcon,
  LocalWorkspaceIcon,
  PublishIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';

import type { SignInState } from '.';
import { Back } from './back';
import * as style from './style.css';

const emailRegex =
  /^(?:(?:[^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(?:(?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|((?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function validateEmail(email: string) {
  return emailRegex.test(email);
}

export const SignInStep = ({
  state,
  changeState,
  onSkip,
  onAuthenticated,
}: {
  state: SignInState;
  changeState: Dispatch<SetStateAction<SignInState>>;
  onSkip: () => void;
  onAuthenticated?: (status: AuthSessionStatus) => void;
}) => {
  const t = useI18n();
  const serverService = useService(ServerService);
  const serverName = useLiveData(
    serverService.server.config$.selector(c => c.serverName)
  );
  const isSelfhosted = useLiveData(
    serverService.server.config$.selector(
      c => c.type === ServerDeploymentType.Selfhosted
    )
  );
  const authService = useService(AuthService);
  const [isMutating, setIsMutating] = useState(false);

  const [email, setEmail] = useState('');

  const [isValidEmail, setIsValidEmail] = useState(true);

  const loginStatus = useLiveData(authService.session.status$);

  useEffect(() => {
    if (loginStatus === 'authenticated') {
      notify.success({
        title: t['com.affine.auth.toast.title.signed-in'](),
        message: t['com.affine.auth.toast.message.signed-in'](),
      });
    }
    onAuthenticated?.(loginStatus);
  }, [loginStatus, onAuthenticated, t]);

  const onContinue = useAsyncCallback(async () => {
    if (!validateEmail(email)) {
      setIsValidEmail(false);
      return;
    }

    setIsValidEmail(true);
    setIsMutating(true);

    try {
      const { hasPassword } = await authService.checkUserByEmail(email);

      if (hasPassword) {
        changeState(prev => ({
          ...prev,
          email,
          step: 'signInWithPassword',
          hasPassword: true,
        }));
      } else {
        changeState(prev => ({
          ...prev,
          email,
          step: 'signInWithEmail',
          hasPassword: false,
        }));
      }
    } catch (err: any) {
      console.error(err);

      // TODO(@eyhn): 改进错误处理
      notify.error({
        title: '登录失败',
        message: err.message,
      });
    }

    setIsMutating(false);
  }, [authService, changeState, email]);

  const onAddSelfhosted = useCallback(() => {
    changeState(prev => ({
      ...prev,
      step: 'addSelfhosted',
    }));
  }, [changeState]);

  return (
    <AuthContainer>
      <AuthHeader
        title={t['com.affine.auth.sign.in']()}
        subTitle={serverName}
      />

      <AuthContent>
        <OAuth redirectUrl={state.redirectUrl} />

        <AuthInput
          className={style.authInput}
          label={t['com.affine.settings.email']()}
          placeholder={t['com.affine.auth.sign.email.placeholder']()}
          onChange={setEmail}
          error={!isValidEmail}
          errorHint={
            isValidEmail ? '' : t['com.affine.auth.sign.email.error']()
          }
          onEnter={onContinue}
        />

        <Button
          className={style.signInButton}
          size="extraLarge"
          data-testid="continue-login-button"
          block
          loading={isMutating}
          suffix={<ArrowRightBigIcon />}
          suffixStyle={{ width: 20, height: 20, color: cssVar('blue') }}
          onClick={onContinue}
        >
          {t['com.affine.auth.sign.email.continue']()}
        </Button>

        <>
          <div className={style.authMessage}>
            {/*prettier-ignore*/}
            <Trans i18nKey="com.affine.auth.sign.message">
              By clicking &quot;Continue&quot; above, you acknowledge that you agree to AFFiNE's
              <a href="https://affine.pro/terms" target="_blank" rel="noreferrer">
                Terms of Conditions
              </a>{' '}
              and
              <a href="https://affine.pro/privacy" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              .
          </Trans>
          </div>
          <div className={style.skipDivider}>
            <div className={style.skipDividerLine} />
            <span className={style.skipDividerText}>或</span>
            <div className={style.skipDividerLine} />
          </div>
          <div className={style.skipSection}>
            {BUILD_CONFIG.isNative ? (
              <Button
                variant="plain"
                className={style.addSelfhostedButton}
                prefix={
                  <PublishIcon className={style.addSelfhostedButtonPrefix} />
                }
                onClick={onAddSelfhosted}
              >
                {t['com.affine.auth.sign.add-selfhosted']()}
              </Button>
            ) : (
              <div className={style.skipText}>
                {t['com.affine.mobile.sign-in.skip.hint']()}
              </div>
            )}
            <Button
              variant="plain"
              onClick={onSkip}
              className={style.skipLink}
              prefix={<LocalWorkspaceIcon className={style.skipLinkIcon} />}
            >
              {t['com.affine.mobile.sign-in.skip.link']()}
            </Button>
          </div>
        </>
      </AuthContent>
      <AuthFooter>
        <Back changeState={changeState} />
      </AuthFooter>
    </AuthContainer>
  );
};

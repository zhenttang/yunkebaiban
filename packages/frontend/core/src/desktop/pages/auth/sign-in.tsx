import { notify } from '@yunke/component';
import { YunkeOtherPageLayout } from '@yunke/component/yunke-other-page-layout';
import { SignInPageContainer } from '@yunke/component/auth-components';
import { SignInPanel } from '@yunke/core/components/sign-in';
import { SignInBackgroundArts } from '@yunke/core/components/sign-in/background-arts';
import type { AuthSessionStatus } from '@yunke/core/modules/cloud/entities/session';
import { useI18n } from '@yunke/i18n';
import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  RouteLogic,
  useNavigateHelper,
} from '../../../components/hooks/use-navigate-helper';
import * as pageStyle from './sign-in.css';

export const SignIn = ({
  redirectUrl: redirectUrlFromProps,
}: {
  redirectUrl?: string;
}) => {
  const t = useI18n();
  const navigate = useNavigate();
  const { jumpToIndex } = useNavigateHelper();
  const [searchParams] = useSearchParams();
  const redirectUrl = redirectUrlFromProps ?? searchParams.get('redirect_uri');

  const server = searchParams.get('server') ?? undefined;
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      notify.error({
        title: t['com.yunke.auth.toast.title.failed'](),
        message: error,
      });
    }
  }, [error, t]);

  const handleClose = useCallback(() => {
    jumpToIndex(RouteLogic.REPLACE, {
      search: searchParams.toString(),
    });
  }, [jumpToIndex, searchParams]);

  const handleAuthenticated = useCallback(
    (status: AuthSessionStatus) => {
      if (status === 'authenticated') {
        if (redirectUrl) {
          if (redirectUrl.toUpperCase() === 'CLOSE_POPUP') {
            window.close();
          }
          navigate(redirectUrl, {
            replace: true,
          });
        } else {
          handleClose();
        }
      }
    },
    [handleClose, navigate, redirectUrl]
  );

  const initStep = server ? 'addSelfhosted' : 'signIn';

  const highlightItems = [
    t['com.yunke.auth.sign.hero.point.email'](),
    t['com.yunke.auth.sign.hero.point.selfhost'](),
    t['com.yunke.auth.sign.hero.point.offline'](),
  ];

  return (
    <SignInPageContainer>
      <SignInBackgroundArts />
      <div className={pageStyle.layout}>
        <section className={pageStyle.hero}>
          <span className={pageStyle.heroBadge}>YUNKE</span>
          <h1 className={pageStyle.heroTitle}>
            {t['com.yunke.auth.sign.hero.title']()}
          </h1>
          <p className={pageStyle.heroSubtitle}>
            {t['com.yunke.auth.sign.hero.subtitle']()}
          </p>
          <div className={pageStyle.heroHighlights}>
            {highlightItems.map((item, index) => (
              <div key={index} className={pageStyle.heroHighlight}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M16.6666 5L7.49992 14.1667L3.33325 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
        <section className={pageStyle.panel}>
          <SignInPanel
            onSkip={handleClose}
            onAuthenticated={handleAuthenticated}
            initStep={initStep}
            server={server}
          />
        </section>
      </div>
    </SignInPageContainer>
  );
};

export const Component = () => {
  return (
    <YunkeOtherPageLayout>
      <SignIn />
    </YunkeOtherPageLayout>
  );
};

import { notify } from '@affine/component';
import { AffineOtherPageLayout } from '@affine/component/affine-other-page-layout';
import { SignInPageContainer } from '@affine/component/auth-components';
import { SignInPanel } from '@affine/core/components/sign-in';
import { SignInBackgroundArts } from '@affine/core/components/sign-in/background-arts';
import type { AuthSessionStatus } from '@affine/core/modules/cloud/entities/session';
import { useI18n } from '@affine/i18n';
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
        title: t['com.affine.auth.toast.title.failed'](),
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
    t['com.affine.auth.sign.hero.point.email'](),
    t['com.affine.auth.sign.hero.point.selfhost'](),
    t['com.affine.auth.sign.hero.point.offline'](),
  ];

  return (
    <SignInPageContainer>
      <SignInBackgroundArts />
      <div className={pageStyle.layout}>
        <section className={pageStyle.hero}>
          <span className={pageStyle.heroBadge}>AFFiNE</span>
          <h1 className={pageStyle.heroTitle}>
            {t['com.affine.auth.sign.hero.title']()}
          </h1>
          <p className={pageStyle.heroSubtitle}>
            {t['com.affine.auth.sign.hero.subtitle']()}
          </p>
          <div className={pageStyle.heroHighlights}>
            {highlightItems.map((item, index) => (
              <div key={index} className={pageStyle.heroHighlight}>
                <span className={pageStyle.heroDot} />
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
    <AffineOtherPageLayout>
      <SignIn />
    </AffineOtherPageLayout>
  );
};

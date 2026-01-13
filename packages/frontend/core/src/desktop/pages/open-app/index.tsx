import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { FetchService } from '@yunke/core/modules/cloud';
import { OpenInAppPage } from '@yunke/core/modules/open-in-app/views/open-in-app-page';
import {
  appSchemaUrl,
  appSchemes,
  channelToScheme,
} from '@yunke/core/utils/channel';
// import type { GetCurrentUserQuery } from '@yunke/graphql';
// import { getCurrentUserQuery } from '@yunke/graphql';
import { useService } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { AppContainer } from '../../components/app-container';

const OpenUrl = () => {
  const [params] = useSearchParams();
  const urlToOpen = params.get('url');
  const navigateHelper = useNavigateHelper();

  const onOpenHere = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      navigateHelper.jumpToIndex();
    },
    [navigateHelper]
  );

  const parsed = appSchemaUrl.safeParse(urlToOpen);
  if (!parsed.success) {
    console.error(parsed.error);
    return null;
  }

  const urlObj = new URL(parsed.data);
  params.forEach((v, k) => {
    if (k === 'url') {
      return;
    }
    urlObj.searchParams.set(k, v);
  });

  return (
    <OpenInAppPage urlToOpen={urlObj.toString()} openHereClicked={onOpenHere} />
  );
};

/**
 * @deprecated
 */
const OpenOAuthJwt = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [params] = useSearchParams();
  const fetchService = useService(FetchService);

  const maybeScheme = appSchemes.safeParse(params.get('scheme'));
  const scheme = maybeScheme.success
    ? maybeScheme.data
    : channelToScheme[BUILD_CONFIG.appBuildType];
  const next = params.get('next') || '';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchService.fetch('/api/auth/session', { method: 'GET' });
        const data = await res.json();
        setCurrentUser(data?.user || null);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [fetchService]);

  if (!currentUser || !(currentUser as any)?.token?.sessionToken) {
    return <AppContainer fallback />;
  }

  const urlToOpen = `${scheme}://signin-redirect?token=${(currentUser as any).token.sessionToken}&next=${next}`;

  return <OpenInAppPage urlToOpen={urlToOpen} />;
};

export const Component = () => {
  const params = useParams<{ action: string }>();
  const action = params.action || '';

  if (action === 'url') {
    return <OpenUrl />;
  } else if (action === 'signin-redirect') {
    return <OpenOAuthJwt />;
  }
  return null;
};

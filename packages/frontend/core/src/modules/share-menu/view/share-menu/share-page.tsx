import { Divider } from '@yunke/component';
import { Loading } from '@yunke/component/ui/loading';
import { Button } from '@yunke/component/ui/button';
import { useGuard } from '@yunke/core/components/guard';
import { ServerService } from '@yunke/core/modules/cloud';
import { DocService } from '@yunke/core/modules/doc';
import { ShareInfoService } from '@yunke/core/modules/share-doc';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { Suspense, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { CloudSvg } from '../cloud-svg';
import { CopyLinkButton } from './copy-link-button';
import { MembersPermission, PublicDoc } from './general-access';
import * as styles from './index.css';
import { InviteInput } from './invite-member-editor';
import { MembersRow } from './member-management';
import type { ShareMenuProps } from './share-menu';

const SharePageErrorFallback = ({
  resetErrorBoundary,
}: {
  resetErrorBoundary: () => void;
}) => {
  const t = useI18n();
  return (
    <div className={styles.stateContainer}>
      <div>{t['com.yunke.share-menu.load-error']()}</div>
      <Button size="small" variant="secondary" onClick={resetErrorBoundary}>
        {t['com.yunke.share-menu.retry']()}
      </Button>
    </div>
  );
};

export const LocalSharePage = (props: ShareMenuProps) => {
  const t = useI18n();
  const {
    workspaceMetadata: { id: workspaceId },
  } = props;
  return (
    <>
      <div className={styles.localSharePage}>
        <div className={styles.columnContainerStyle} style={{ gap: '12px' }}>
          <div
            className={styles.descriptionStyle}
            style={{ maxWidth: '230px' }}
          >
            {t['com.yunke.share-menu.EnableCloudDescription']()}
          </div>
          <div>
            <Button
              onClick={props.onEnableYunkeCloud}
              variant="primary"
              data-testid="share-menu-enable-yunke-cloud-button"
            >
              {t['Enable YUNKE Cloud']()}
            </Button>
          </div>
        </div>
        <div className={styles.cloudSvgContainer}>
          <CloudSvg />
        </div>
      </div>
      <CopyLinkButton workspaceId={workspaceId} secondary />
    </>
  );
};

export const YUNKESharePage = (
  props: ShareMenuProps & {
    onClickInvite: () => void;
    onClickMembers: () => void;
  }
) => {
  const t = useI18n();
  const {
    workspaceMetadata: { id: workspaceId },
  } = props;
  const shareInfoService = useService(ShareInfoService);
  const serverService = useService(ServerService);
  const docService = useService(DocService);

  const canManageUsers = useGuard('Doc_Users_Manage', docService.doc.id);

  const canPublish = useGuard('Doc_Publish', docService.doc.id);

  useEffect(() => {
    shareInfoService.shareInfo.revalidate();
  }, [shareInfoService]);

  const isSharedPage = useLiveData(shareInfoService.shareInfo.isShared$);
  const sharedMode = useLiveData(shareInfoService.shareInfo.sharedMode$);
  const baseUrl = serverService.server.baseUrl;
  const shareError = useLiveData(shareInfoService.shareInfo.error$);
  const isRevalidating = useLiveData(
    shareInfoService.shareInfo.isRevalidating$
  );
  const isLoading =
    isSharedPage === null || sharedMode === null || baseUrl === null;

  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <Loading />
        <span>{t['com.yunke.share-menu.loading']()}</span>
      </div>
    );
  }

  if (shareError) {
    return (
      <div className={styles.stateContainer}>
        <div>{t['com.yunke.share-menu.load-error']()}</div>
        <Button
          size="small"
          variant="secondary"
          onClick={() => shareInfoService.shareInfo.revalidate()}
        >
          {t['com.yunke.share-menu.retry']()}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <div className={styles.columnContainerStyle}>
        <div className={styles.memberRowsStyle}>
          {canManageUsers && <InviteInput onFocus={props.onClickInvite} />}
          <MembersRow onClick={props.onClickMembers} />
        </div>

        <div className={styles.generalAccessStyle}>
          {t['com.yunke.share-menu.generalAccess']()}
        </div>
        <MembersPermission
          openPaywallModal={props.openPaywallModal}
          hittingPaywall={!!props.hittingPaywall}
          disabled={!canManageUsers}
        />
        <PublicDoc disabled={!canPublish} />
      </div>
      <Divider className={styles.divider} />
      <CopyLinkButton workspaceId={workspaceId} />
      {isRevalidating ? (
        <div className={styles.revalidateIndicator}>
          <Loading size={12} />
          <span>{t['com.yunke.share-menu.loading']()}</span>
        </div>
      ) : null}
    </div>
  );
};

export const SharePage = (
  props: ShareMenuProps & {
    onClickInvite: () => void;
    onClickMembers: () => void;
  }
) => {
  const t = useI18n();
  if (props.workspaceMetadata.flavour === 'local') {
    return <LocalSharePage {...props} />;
  } else {
    return (
      <ErrorBoundary FallbackComponent={SharePageErrorFallback}>
        <Suspense
          fallback={
            <div className={styles.stateContainer}>
              <Loading />
              <span>{t['com.yunke.share-menu.loading']()}</span>
            </div>
          }
        >
          <YUNKESharePage {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  }
};

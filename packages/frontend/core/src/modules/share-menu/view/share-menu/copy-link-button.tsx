import { Button, Menu, MenuItem, MenuTrigger } from '@yunke/component';
import {
  getSelectedNodes,
  useSharingUrl,
} from '@yunke/core/components/hooks/yunke/use-share-url';
import { EditorService } from '@yunke/core/modules/editor';
import { ShareInfoService } from '@yunke/core/modules/share-doc';
import { useI18n } from '@yunke/i18n';
import type { DocMode } from '@blocksuite/yunke/model';
import { BlockIcon, EdgelessIcon, PageIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';

import * as styles from './copy-link-button.css';

export const CopyLinkButton = ({
  workspaceId,
  secondary,
}: {
  secondary?: boolean;
  workspaceId: string;
}) => {
  const t = useI18n();

  const editor = useService(EditorService).editor;
  const shareInfoService = useService(ShareInfoService);
  const currentMode = useLiveData(editor.mode$);
  const editorContainer = useLiveData(editor.editorContainer$);
  const isSharedPage = useLiveData(shareInfoService.shareInfo.isShared$);

  const { blockIds, elementIds } = useMemo(
    () => getSelectedNodes(editorContainer?.host || null, currentMode),
    [editorContainer, currentMode]
  );
  const { onClickCopyLink } = useSharingUrl({
    workspaceId,
    pageId: editor.doc.id,
    isPublic: isSharedPage === true, // 传递文档是否公开的状态
  });

  const onCopyPageLink = useCallback(() => {
    onClickCopyLink('page' as DocMode);
  }, [onClickCopyLink]);
  const onCopyEdgelessLink = useCallback(() => {
    onClickCopyLink('edgeless' as DocMode);
  }, [onClickCopyLink]);
  const onCopyBlockLink = useCallback(() => {
    onClickCopyLink(currentMode, blockIds, elementIds);
  }, [onClickCopyLink, currentMode, blockIds, elementIds]);

  const onCopyLink = useCallback(() => {
    // 对于公开文档，不指定mode参数，让用户可以自由切换模式
    // 只对私有文档或特定选择（block等）才包含mode参数
    if (isSharedPage) {
      // 公开文档：不包含mode参数，允许自由切换
      onClickCopyLink(undefined);
    } else {
      // 私有文档：包含当前模式
      onClickCopyLink();
    }
  }, [onClickCopyLink, isSharedPage]);

  return (
    <div
      className={clsx(styles.copyLinkContainerStyle, { secondary: secondary })}
    >
      <Button
        className={styles.copyLinkButtonStyle}
        onClick={onCopyLink}
        withoutHover
        variant={secondary ? 'secondary' : 'primary'}
      >
        <span
          className={clsx(styles.copyLinkLabelStyle, {
            secondary: secondary,
          })}
        >
          {t['com.yunke.share-menu.copy']()}
        </span>
        {BUILD_CONFIG.isDesktopEdition && (
          <span
            className={clsx(styles.copyLinkShortcutStyle, {
              secondary: secondary,
            })}
          >
            {environment.isMacOs ? '⌘ + ⌥ + C' : 'Ctrl + Shift + C'}
          </span>
        )}
      </Button>
      <Menu
        contentOptions={{
          align: 'end',
        }}
        items={
          <>
            <MenuItem
              prefixIcon={<PageIcon />}
              onSelect={onCopyPageLink}
              data-testid="share-link-menu-copy-page"
            >
              {t['com.yunke.share-menu.copy.page']()}
            </MenuItem>
            <MenuItem
              prefixIcon={<EdgelessIcon />}
              onSelect={onCopyEdgelessLink}
              data-testid="share-link-menu-copy-edgeless"
            >
              {t['com.yunke.share-menu.copy.edgeless']()}
            </MenuItem>
            <MenuItem
              prefixIcon={<BlockIcon />}
              onSelect={onCopyBlockLink}
              disabled={blockIds.length + elementIds.length === 0}
            >
              {t['com.yunke.share-menu.copy.block']()}
            </MenuItem>
          </>
        }
      >
        <MenuTrigger
          variant={secondary ? 'secondary' : 'primary'}
          className={clsx(styles.copyLinkTriggerStyle, {
            secondary: secondary,
          })}
          data-testid="share-menu-copy-link-button"
          suffixStyle={{ width: 20, height: 20 }}
          withoutHover
        />
      </Menu>
    </div>
  );
};

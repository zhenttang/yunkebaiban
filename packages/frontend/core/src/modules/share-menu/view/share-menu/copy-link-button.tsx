import { Button, Menu, MenuItem, MenuTrigger } from '@yunke/component';
import {
  getSelectedNodes,
  useSharingUrl,
} from '@yunke/core/components/hooks/affine/use-share-url';
import { EditorService } from '@yunke/core/modules/editor';
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
  const currentMode = useLiveData(editor.mode$);
  const editorContainer = useLiveData(editor.editorContainer$);

  const { blockIds, elementIds } = useMemo(
    () => getSelectedNodes(editorContainer?.host || null, currentMode),
    [editorContainer, currentMode]
  );
  const { onClickCopyLink } = useSharingUrl({
    workspaceId,
    pageId: editor.doc.id,
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
    onClickCopyLink();
  }, [onClickCopyLink]);

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
          {t['com.affine.share-menu.copy']()}
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
              {t['com.affine.share-menu.copy.page']()}
            </MenuItem>
            <MenuItem
              prefixIcon={<EdgelessIcon />}
              onSelect={onCopyEdgelessLink}
              data-testid="share-link-menu-copy-edgeless"
            >
              {t['com.affine.share-menu.copy.edgeless']()}
            </MenuItem>
            <MenuItem
              prefixIcon={<BlockIcon />}
              onSelect={onCopyBlockLink}
              disabled={blockIds.length + elementIds.length === 0}
            >
              {t['com.affine.share-menu.copy.block']()}
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

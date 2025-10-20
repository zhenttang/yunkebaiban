import { toast, useConfirmModal } from '@yunke/component';
import {
  PreconditionStrategy,
  registerYunkeCommand,
} from '@yunke/core/commands';
import { WorkspaceDialogService } from '@yunke/core/modules/dialogs';
import { DocService } from '@yunke/core/modules/doc';
import type { Editor } from '@yunke/core/modules/editor';
import { EditorSettingService } from '@yunke/core/modules/editor-setting';
import { CompatibleFavoriteItemsAdapter } from '@yunke/core/modules/favorite';
import { OpenInAppService } from '@yunke/core/modules/open-in-app';
import { GuardService } from '@yunke/core/modules/permissions';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { UserFriendlyError } from '@yunke/error';
import { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import {
  EdgelessIcon,
  HistoryIcon,
  LocalWorkspaceIcon,
  PageIcon,
} from '@blocksuite/icons/rc';
import {
  useLiveData,
  useService,
  useServiceOptional,
} from '@toeverything/infra';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

import { pageHistoryModalAtom } from '../../../components/atoms/page-history';
import { useBlockSuiteMetaHelper } from './use-block-suite-meta-helper';
import { useExportPage } from './use-export-page';

export function useRegisterBlocksuiteEditorCommands(
  editor: Editor,
  active: boolean
) {
  const doc = useService(DocService).doc;
  const guardService = useService(GuardService);
  const docId = doc.id;
  const mode = useLiveData(editor.mode$);
  const t = useI18n();
  const workspace = useService(WorkspaceService).workspace;

  const editorSetting = useService(EditorSettingService).editorSetting;
  const defaultPageWidth = useLiveData(editorSetting.settings$).fullWidthLayout;
  const pageWidth = useLiveData(doc.properties$.selector(p => p.pageWidth));
  const checked = pageWidth ? pageWidth === 'fullWidth' : defaultPageWidth;

  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const favorite = useLiveData(favAdapter.isFavorite$(docId, 'doc'));
  const trash = useLiveData(doc.trash$);

  const setPageHistoryModalState = useSetAtom(pageHistoryModalAtom);
  const workspaceDialogService = useService(WorkspaceDialogService);

  const openHistoryModal = useCallback(() => {
    setPageHistoryModalState(() => ({
      pageId: docId,
      open: true,
    }));
  }, [docId, setPageHistoryModalState]);

  const openInfoModal = useCallback(() => {
    workspaceDialogService.open('doc-info', { docId });
  }, [docId, workspaceDialogService]);

  const { duplicate } = useBlockSuiteMetaHelper();
  const exportHandler = useExportPage();
  const { openConfirmModal } = useConfirmModal();
  const onClickDelete = useCallback(() => {
    openConfirmModal({
      title: t['com.yunke.moveToTrash.confirmModal.title'](),
      description: t['com.yunke.moveToTrash.confirmModal.description']({
        title: doc.title$.value || t['Untitled'](),
      }),
      cancelText: t['com.yunke.confirmModal.button.cancel'](),
      confirmButtonOptions: {
        variant: 'error',
      },
      confirmText: t.Delete(),
      onConfirm: async () => {
        try {
          const canTrash = await guardService.can('Doc_Trash', docId);
          if (!canTrash) {
            toast(t['com.yunke.no-permission']());
            return;
          }
          doc.moveToTrash();
        } catch (error) {
          console.error(error);
          const userFriendlyError = UserFriendlyError.fromAny(error);
          toast(t[`error.${userFriendlyError.name}`](userFriendlyError.data));
        }
      },
    });
  }, [doc, docId, guardService, openConfirmModal, t]);

  const isCloudWorkspace = workspace.flavour !== 'local';

  const openInAppService = useServiceOptional(OpenInAppService);

  useEffect(() => {
    if (!active) {
      return;
    }

    const unsubs: Array<() => void> = [];
    const preconditionStrategy = () =>
      PreconditionStrategy.InPaperOrEdgeless && !trash;

    // TODO(@Peng): add back when edgeless presentation is ready

    // this is pretty hack and easy to break. need a better way to communicate with blocksuite editor
    // unsubs.push(
    //   registerYunkeCommand({
    //     id: 'editor:edgeless-presentation-start',
    //     preconditionStrategy: () => PreconditionStrategy.InEdgeless && !trash,
    //     category: 'editor:edgeless',
    //     icon: <EdgelessIcon />,
    //     label: t['com.yunke.cmdk.yunke.editor.edgeless.presentation-start'](),
    //     run() {
    //       document
    //         .querySelector<HTMLElement>('edgeless-toolbar')
    //         ?.shadowRoot?.querySelector<HTMLElement>(
    //           '.edgeless-toolbar-left-part > edgeless-tool-icon-button:last-child'
    //         )
    //         ?.click();
    //     },
    //   })
    // );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-view-info`,
        preconditionStrategy: () =>
          PreconditionStrategy.InPaperOrEdgeless && !trash,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['com.yunke.page-properties.page-info.view'](),
        run() {
          track.$.cmdk.docInfo.open();

          openInfoModal();
        },
      })
    );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-${favorite ? 'remove-from' : 'add-to'}-favourites`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: favorite
          ? t['com.yunke.favoritePageOperation.remove']()
          : t['com.yunke.favoritePageOperation.add'](),
        run() {
          favAdapter.toggle(docId, 'doc');
          track.$.cmdk.editor.toggleFavorite();

          toast(
            favorite
              ? t['com.yunke.cmdk.yunke.editor.remove-from-favourites']()
              : t['com.yunke.cmdk.yunke.editor.add-to-favourites']()
          );
        },
      })
    );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-convert-to-${
          mode === 'page' ? 'edgeless' : 'page'
        }`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: `${t['Convert to ']()}${
          mode === 'page'
            ? t['com.yunke.pageMode.edgeless']()
            : t['com.yunke.pageMode.page']()
        }`,
        run() {
          track.$.cmdk.editor.switchPageMode({
            mode: mode === 'page' ? 'edgeless' : 'page',
          });

          editor.toggleMode();
          toast(
            mode === 'page'
              ? t['com.yunke.toastMessage.edgelessMode']()
              : t['com.yunke.toastMessage.pageMode']()
          );
        },
      })
    );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:page-set-width`,
        preconditionStrategy: () => mode === 'page',
        category: `editor:page`,
        icon: <PageIcon />,
        label: checked
          ? t['com.yunke.cmdk.yunke.current-page-width-layout.standard']()
          : t['com.yunke.cmdk.yunke.current-page-width-layout.full-width'](),
        async run() {
          const canEdit = await guardService.can('Doc_Update', docId);
          if (!canEdit) {
            toast(t['com.yunke.no-permission']());
            return;
          }
          doc.record.setProperty(
            'pageWidth',
            checked ? 'standard' : 'fullWidth'
          );
        },
      })
    );

    // TODO(@Peng): should not show duplicate for journal
    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-duplicate`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['com.yunke.header.option.duplicate'](),
        run() {
          duplicate(docId);
          track.$.cmdk.editor.createDoc({
            control: 'duplicate',
          });
        },
      })
    );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-export-to-html`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['Export to HTML'](),
        async run() {
          track.$.cmdk.editor.export({
            type: 'html',
          });

          exportHandler('html');
        },
      })
    );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-export-to-png`,
        preconditionStrategy: () => mode === 'page' && !trash,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['Export to PNG'](),
        async run() {
          track.$.cmdk.editor.export({
            type: 'png',
          });

          exportHandler('png');
        },
      })
    );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-export-to-markdown`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['Export to Markdown'](),
        async run() {
          track.$.cmdk.editor.export({
            type: 'markdown',
          });

          exportHandler('markdown');
        },
      })
    );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-export-to-snapshot`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['Export to Snapshot'](),
        async run() {
          track.$.cmdk.editor.export({
            type: 'snapshot',
          });

          exportHandler('snapshot');
        },
      })
    );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-move-to-trash`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['com.yunke.moveToTrash.title'](),
        run() {
          track.$.cmdk.editor.deleteDoc();

          onClickDelete();
        },
      })
    );

    unsubs.push(
      registerYunkeCommand({
        id: `editor:${mode}-restore-from-trash`,
        preconditionStrategy: () =>
          PreconditionStrategy.InPaperOrEdgeless && trash,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['com.yunke.cmdk.yunke.editor.restore-from-trash'](),
        async run() {
          const canRestore = await guardService.can('Doc_Restore', docId);
          if (!canRestore) {
            toast(t['com.yunke.no-permission']());
            return;
          }
          track.$.cmdk.editor.restoreDoc();

          doc.restoreFromTrash();
        },
      })
    );

    if (isCloudWorkspace) {
      unsubs.push(
        registerYunkeCommand({
          id: `editor:${mode}-page-history`,
          category: `editor:${mode}`,
          icon: <HistoryIcon />,
          label: t['com.yunke.cmdk.yunke.editor.reveal-page-history-modal'](),
          run() {
            track.$.cmdk.docHistory.open();

            openHistoryModal();
          },
        })
      );
    }

    if (isCloudWorkspace && BUILD_CONFIG.isWeb) {
      unsubs.push(
        registerYunkeCommand({
          id: 'editor:open-in-app',
          category: `editor:${mode}`,
          icon: <LocalWorkspaceIcon />,
          label: t['com.yunke.header.option.open-in-desktop'](),
          run() {
            openInAppService?.showOpenInAppPage();
          },
        })
      );
    }

    unsubs.push(
      registerYunkeCommand({
        id: 'alert-ctrl-s',
        category: 'yunke:general',
        preconditionStrategy: PreconditionStrategy.Never,
        keyBinding: {
          binding: '$mod+s',
        },
        label: '',
        icon: null,
        run() {
          // do nothing
        },
      })
    );

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [
    editor,
    favorite,
    mode,
    onClickDelete,
    exportHandler,
    t,
    trash,
    isCloudWorkspace,
    openHistoryModal,
    duplicate,
    favAdapter,
    docId,
    doc,
    openInfoModal,
    pageWidth,
    defaultPageWidth,
    checked,
    openInAppService,
    active,
    guardService,
  ]);
}

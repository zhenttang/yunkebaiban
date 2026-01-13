import { updateBlockType } from '@blocksuite/yunke/blocks/note';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback } from 'react';

import { EditorService } from '../../modules/editor';
import * as styles from './quick-format-toolbar.css';

export function QuickFormatToolbar() {
  const editorService = useService(EditorService);
  const editorContainer = useLiveData(editorService.editor.editorContainer$);

  const executeCommand = useCallback(
    (flavour: string, type?: string) => {
      if (!editorContainer?.host?.std) return;

      const std = editorContainer.host.std;
      std.command.exec(updateBlockType, {
        flavour,
        props: type ? { type } : {},
      });
    },
    [editorContainer]
  );

  const buttons = [
    {
      id: 'h1',
      label: 'H1',
      tooltip: '一级标题 (Ctrl+Alt+1)',
      action: () => executeCommand('yunke:paragraph', 'h1'),
    },
    {
      id: 'h2',
      label: 'H2',
      tooltip: '二级标题 (Ctrl+Alt+2)',
      action: () => executeCommand('yunke:paragraph', 'h2'),
    },
    {
      id: 'h3',
      label: 'H3',
      tooltip: '三级标题 (Ctrl+Alt+3)',
      action: () => executeCommand('yunke:paragraph', 'h3'),
    },
    {
      id: 'paragraph',
      label: '¶',
      tooltip: '段落 (Ctrl+Alt+0)',
      action: () => executeCommand('yunke:paragraph', 'text'),
    },
    {
      id: 'bullet',
      label: '•',
      tooltip: '无序列表 (Ctrl+Shift+8)',
      action: () => executeCommand('yunke:list', 'bulleted'),
    },
    {
      id: 'number',
      label: '1.',
      tooltip: '有序列表 (Ctrl+Shift+7)',
      action: () => executeCommand('yunke:list', 'numbered'),
    },
    {
      id: 'quote',
      label: '"',
      tooltip: '引用',
      action: () => executeCommand('yunke:paragraph', 'quote'),
    },
    {
      id: 'code',
      label: '</>',
      tooltip: '代码块',
      action: () => executeCommand('yunke:code'),
    },
  ];

  const isEditorReady = Boolean(editorContainer?.host?.std);

  return (
    <div className={clsx(styles.container, !isEditorReady && styles.disabled)}>
      {buttons.map((button) => (
        <button
          key={button.id}
          className={styles.button}
          onClick={button.action}
          title={button.tooltip}
          disabled={!isEditorReady}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}

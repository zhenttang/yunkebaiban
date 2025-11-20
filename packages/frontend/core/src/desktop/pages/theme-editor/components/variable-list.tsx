import * as Popover from '@radix-ui/react-popover';
import { PaletteIcon } from '@blocksuite/icons/rc';
import { Scrollable } from '@yunke/component';
import { ThemeEditorService } from '@yunke/core/modules/theme-editor';
import { useLiveData, useService } from '@toeverything/infra';

import type { TreeNode } from '../resource';
import * as styles from '../theme-editor.css';
import { getVariableMetadata } from '../variable-descriptions';
import { getPreviewComponent } from '../preview-registry';
import { isColor } from '../utils';
import { ColorCell } from './color-cell';
import { StringCell } from './string-cell';

export const VariableList = ({ node }: { node: TreeNode }) => {
  const themeEditor = useService(ThemeEditorService);
  const customTheme = useLiveData(themeEditor.customTheme$);

  const variables = node.variables ?? [];

  // 如果没有变量，显示提示
  if (variables.length === 0) {
    return (
      <main className={styles.content}>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          该节点没有可编辑的变量
        </div>
      </main>
    );
  }

  return (
    <main className={styles.content}>
      <header>
        <ul className={styles.row}>
          <li>名称</li>
          <li>明亮模式</li>
          <li>暗黑模式</li>
        </ul>
      </header>
      <Scrollable.Root className={styles.mainScrollable}>
        <Scrollable.Viewport className={styles.mainViewport}>
          {variables.map(variable => {
            // 变量名去掉前缀后是横线分隔的，如 block-callout-icon-blue
            const varNameWithoutPrefix = variable.variableName.replace(/^--yunke-(v2-)?/, '');
            // 构建完整路径：node.id + variable.name
            // 例如：node.id = /switch/fontColor, variable.name = primary -> /switch/fontColor/primary
            const fullPath = node.id && variable.name
              ? `${node.id}/${variable.name}`
              : node.id || '';

            const metadata = getVariableMetadata(varNameWithoutPrefix, fullPath);
            const PreviewComponent = getPreviewComponent(varNameWithoutPrefix, fullPath);

            const description = metadata?.description;
            const previewImage = metadata?.preview;
            const context = metadata?.context;

            const hasPreview = PreviewComponent || previewImage || context;

            return (
              <ul className={styles.row} key={variable.variableName}>
                <li
                  style={{
                    textDecoration:
                      customTheme?.light?.[variable.variableName] ||
                        customTheme?.dark?.[variable.variableName]
                        ? 'underline'
                        : 'none',
                  }}
                  title={description || undefined}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {variable.name}
                    {description && (
                      <span style={{ color: '#999', fontWeight: 'normal', marginLeft: '4px' }}>
                        ({description})
                      </span>
                    )}
                    {hasPreview && (
                      <Popover.Root>
                        <Popover.Trigger asChild>
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              marginLeft: 8,
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              color: '#666',
                              opacity: 0.7
                            }}
                            title="查看预览"
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                          >
                            <PaletteIcon width={16} height={16} />
                          </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Content className={styles.previewPopoverContent} sideOffset={5}>
                            {PreviewComponent ? (
                              <div style={{ marginBottom: context ? '8px' : '0' }}>
                                <PreviewComponent />
                              </div>
                            ) : previewImage ? (
                              <img
                                src={previewImage}
                                alt="Preview"
                                className={styles.previewImage}
                              />
                            ) : null}

                            {context && (
                              <div className={styles.previewContext}>
                                {context}
                              </div>
                            )}
                            <Popover.Arrow style={{ fill: 'var(--yunke-layer-background-primary)' }} />
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover.Root>
                    )}
                  </span>
                </li>
                {(['light', 'dark'] as const).map(mode => {
                  const value = variable[mode] ?? '';
                  const Renderer = isColor(value, variable.variableName, variable.ancestors)
                    ? ColorCell
                    : StringCell;
                  return (
                    <li key={mode}>
                      <Renderer
                        value={value}
                        custom={customTheme?.[mode]?.[variable.variableName]}
                        onValueChange={color =>
                          themeEditor.updateCustomTheme(
                            mode,
                            variable.variableName,
                            color
                          )
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            );
          })}
        </Scrollable.Viewport>
        <Scrollable.Scrollbar />
      </Scrollable.Root>
    </main>
  );
};

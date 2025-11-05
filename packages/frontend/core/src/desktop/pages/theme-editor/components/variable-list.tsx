import { Scrollable } from '@yunke/component';
import { ThemeEditorService } from '@yunke/core/modules/theme-editor';
import { useLiveData, useService } from '@toeverything/infra';

import type { TreeNode } from '../resource';
import * as styles from '../theme-editor.css';
import { getVariableDescription } from '../variable-descriptions';
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
            // 使用完整路径来匹配描述
            const varDescription = getVariableDescription(varNameWithoutPrefix, fullPath);
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
                  title={varDescription || undefined}
                >
                  <span>
                    {variable.name}
                    {varDescription && (
                      <span style={{ color: '#999', fontWeight: 'normal', marginLeft: '4px' }}>
                        ({varDescription})
                      </span>
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

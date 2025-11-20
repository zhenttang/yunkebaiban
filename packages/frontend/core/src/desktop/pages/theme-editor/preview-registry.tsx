import { Button, Switch, Checkbox, Input } from '@yunke/component';
import { cssVarV2 } from '@toeverything/theme/v2';
import { cssVar } from '@toeverything/theme';
import type { ReactNode } from 'react';

// 自定义 Callout 预览组件
const CalloutPreview = () => (
    <div
        style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: cssVarV2('block/callout/background'),
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            width: '240px',
        }}
    >
        <div
            style={{
                color: cssVarV2('block/callout/icon'),
                fontSize: '16px',
                lineHeight: '24px',
            }}
        >
            💡
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', lineHeight: '24px' }}>
                这是一个标注块示例。
            </div>
        </div>
    </div>
);

// 注册表类型定义
type PreviewComponent = () => ReactNode;

// 组件注册表
export const previewRegistry: Record<string, PreviewComponent> = {
    // 按钮相关
    'button/primary': () => <Button variant="primary">Primary Button</Button>,
    'button/secondary': () => <Button variant="secondary">Secondary Button</Button>,
    'button/error': () => <Button variant="error">Error Button</Button>,
    'button/disable': () => <Button disabled>Disabled Button</Button>,

    // 开关相关
    'switch': () => <Switch checked onChange={() => { }} />,
    'switch/buttonBackground': () => <Switch checked onChange={() => { }} />,
    'switch/switchBackground': () => <Switch checked onChange={() => { }} />,

    // 复选框
    'button/checkBox': () => <Checkbox checked onChange={() => { }} />,

    // 输入框
    'input': () => <Input placeholder="请输入内容..." style={{ width: '200px' }} />,
    'input/background': () => <Input placeholder="请输入内容..." style={{ width: '200px' }} />,
    'input/border': () => <Input placeholder="请输入内容..." style={{ width: '200px' }} />,

    // 标注块
    'block/callout': CalloutPreview,
    'block/callout/background': CalloutPreview,
    'block/callout/icon': CalloutPreview,
};

/**
 * 获取预览组件
 * @param variableName 变量名 (e.g., 'button/primary')
 * @param nodePath 完整路径 (e.g., '/button/primary')
 */
export const getPreviewComponent = (variableName: string, nodePath?: string): PreviewComponent | undefined => {
    // 优先使用完整路径
    if (nodePath) {
        const fullPath = nodePath.replace(/^\//, '');

        // 1. 尝试完整路径
        if (previewRegistry[fullPath]) {
            return previewRegistry[fullPath];
        }

        // 2. 尝试逐步去掉最后一部分
        const pathParts = fullPath.split('/');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const prefix = pathParts.slice(0, i).join('/');
            if (previewRegistry[prefix]) {
                return previewRegistry[prefix];
            }
        }
    }

    // 处理变量名
    let normalizedName = variableName;
    if (variableName.includes('-') && !variableName.includes('/')) {
        normalizedName = variableName.replace(/-/g, '/');
    }

    // 1. 尝试完整变量名
    if (previewRegistry[normalizedName]) {
        return previewRegistry[normalizedName];
    }

    // 2. 尝试前缀
    const parts = normalizedName.split('/');
    for (let i = parts.length - 1; i > 0; i--) {
        const prefix = parts.slice(0, i).join('/');
        if (previewRegistry[prefix]) {
            return previewRegistry[prefix];
        }
    }

    return undefined;
};

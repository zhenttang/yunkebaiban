import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

// 便签模板类型
export interface NoteTemplate {
    id: string;
    name: string;
    icon: string;
    description: string;
    content?: string;
}

// 预定义的便签模板
export const NOTE_TEMPLATES: NoteTemplate[] = [
    {
        id: 'blank',
        name: '空白便签',
        icon: '📝',
        description: '创建一个空白便签',
    },
    {
        id: 'todo',
        name: '待办事项',
        icon: '✅',
        description: '快速记录待办任务',
        content: '- [ ] 任务1\n- [ ] 任务2\n- [ ] 任务3',
    },
    {
        id: 'idea',
        name: '灵感记录',
        icon: '💡',
        description: '捕捉创意灵感',
        content: '💡 我的想法：\n\n',
    },
    {
        id: 'question',
        name: '问题记录',
        icon: '❓',
        description: '记录待解决的问题',
        content: '❓ 问题：\n\n📋 背景：\n\n💭 思考：\n',
    },
    {
        id: 'meeting',
        name: '会议笔记',
        icon: '📅',
        description: '记录会议要点',
        content: '📅 会议主题：\n\n👥 参会人员：\n\n📋 会议要点：\n\n✅ 行动项：\n',
    },
    {
        id: 'review',
        name: '回顾总结',
        icon: '📊',
        description: '项目或阶段回顾',
        content: '📊 回顾总结\n\n✅ 做得好的：\n\n❌ 需改进的：\n\n💡 下一步：\n',
    },
];

export class NoteTemplatePanel extends LitElement {
    static override styles = css`
        :host {
            display: block;
        }

        .template-panel {
            padding: 8px;
        }

        .template-panel-title {
            font-size: 12px;
            color: var(--yunke-text-secondary-color, #666);
            margin-bottom: 8px;
            padding: 0 4px;
        }

        .template-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }

        .template-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px;
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            background: var(--yunke-background-secondary-color, #f9f9f9);
        }

        .template-item:hover {
            border-color: var(--yunke-primary-color, #1e96eb);
            background: var(--yunke-hover-color, #f0f0f0);
        }

        .template-icon {
            font-size: 20px;
        }

        .template-info {
            flex: 1;
            min-width: 0;
        }

        .template-name {
            font-size: 13px;
            font-weight: 500;
            color: var(--yunke-text-primary-color, #333);
            margin-bottom: 2px;
        }

        .template-desc {
            font-size: 11px;
            color: var(--yunke-text-secondary-color, #999);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `;

    @property({ attribute: false })
    accessor onTemplateSelect: ((template: NoteTemplate) => void) | undefined;

    private _handleTemplateClick(template: NoteTemplate) {
        this.onTemplateSelect?.(template);
    }

    override render() {
        return html`
            <div class="template-panel">
                <div class="template-panel-title">便签模板</div>
                <div class="template-grid">
                    ${NOTE_TEMPLATES.map(
                        template => html`
                            <div
                                class="template-item"
                                @click=${() => this._handleTemplateClick(template)}
                                title=${template.description}
                            >
                                <span class="template-icon">${template.icon}</span>
                                <div class="template-info">
                                    <div class="template-name">${template.name}</div>
                                    <div class="template-desc">${template.description}</div>
                                </div>
                            </div>
                        `
                    )}
                </div>
            </div>
        `;
    }
}

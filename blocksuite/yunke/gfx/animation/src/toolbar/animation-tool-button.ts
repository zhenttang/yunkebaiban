import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

/**
 * 动画工具栏按钮
 */
export class AnimationToolButton extends LitElement {
    static override styles = css`
        :host {
            display: inline-flex;
        }

        .animation-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .animation-btn:hover {
            background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
        }

        .animation-btn.active {
            background: var(--affine-primary-color, #1e96eb);
            color: white;
        }

        .animation-btn svg {
            width: 20px;
            height: 20px;
        }
    `;

    @property({ type: Boolean })
    accessor active = false;

    override render() {
        return html`
            <button
                class="animation-btn ${this.active ? 'active' : ''}"
                title="动画协助"
                @click=${this._handleClick}
            >
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"
                        opacity="0.3"
                    />
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                    />
                    <path d="M10 8l6 4-6 4V8z" />
                </svg>
            </button>
        `;
    }

    private _handleClick() {
        this.dispatchEvent(
            new CustomEvent('toggle-animation', {
                bubbles: true,
                composed: true,
            })
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'animation-tool-button': AnimationToolButton;
    }
}

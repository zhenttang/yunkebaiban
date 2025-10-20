import { requestConnectedFrame } from '@blocksuite/yunke-shared/utils';
import {
  arrow,
  type ComputePositionReturn,
  flip,
  hide,
  offset,
  type Placement,
  shift,
} from '@floating-ui/dom';
import type { CSSResult } from 'lit';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { HoverController, type HoverOptions } from '../hover/index.js';

const styles = css`
  .yunke-tooltip {
    box-sizing: border-box;
    max-width: 280px;
    min-height: 32px;
    font-family: var(--yunke-font-family);
    font-size: var(--yunke-font-sm);
    border-radius: 4px;
    padding: 6px 12px;
    color: var(--yunke-white);
    background: var(--yunke-tooltip);

    overflow-wrap: anywhere;
    white-space: normal;
    word-break: break-word;
  }

  .arrow {
    position: absolute;

    width: 0;
    height: 0;
  }
`;

// See http://apps.eky.hk/css-triangle-generator/
const TRIANGLE_HEIGHT = 6;
const triangleMap = {
  top: {
    bottom: '-6px',
    borderStyle: 'solid',
    borderWidth: '6px 5px 0 5px',
    borderColor: 'var(--yunke-tooltip) transparent transparent transparent',
  },
  right: {
    left: '-6px',
    borderStyle: 'solid',
    borderWidth: '5px 6px 5px 0',
    borderColor: 'transparent var(--yunke-tooltip) transparent transparent',
  },
  bottom: {
    top: '-6px',
    borderStyle: 'solid',
    borderWidth: '0 5px 6px 5px',
    borderColor: 'transparent transparent var(--yunke-tooltip) transparent',
  },
  left: {
    right: '-6px',
    borderStyle: 'solid',
    borderWidth: '5px 0 5px 6px',
    borderColor: 'transparent transparent transparent var(--yunke-tooltip)',
  },
};

// The padding for the autoShift and autoFlip middleware
// It's used to prevent the tooltip from overflowing the screen
const AUTO_SHIFT_PADDING = 12;
const AUTO_FLIP_PADDING = 12;

// Ported from https://floating-ui.com/docs/tutorial#arrow-middleware
const updateArrowStyles = ({
  placement,
  middlewareData,
}: ComputePositionReturn): StyleInfo => {
  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;

  const triangleStyles =
    triangleMap[placement.split('-')[0] as keyof typeof triangleMap];

  return {
    left: arrowX != null ? `${arrowX}px` : '',
    top: arrowY != null ? `${arrowY}px` : '',
    ...triangleStyles,
  };
};

/**
 * @example
 * ```ts
 * // Simple usage
 * html`
 * <yunke-tooltip>Content</yunke-tooltip>
 * `
 * // With placement
 * html`
 * <yunke-tooltip tip-position="top">
 *   Content
 * </yunke-tooltip>
 * `
 *
 * // With custom properties
 * html`
 * <yunke-tooltip
 *   .zIndex=${0}
 *   .offset=${4}
 *   .autoFlip=${true}
 *   .arrow=${true}
 *   .tooltipStyle=${css`:host { z-index: 0; --yunke-tooltip: #fff; }`}
 *   .allowInteractive=${false}
 * >
 *   Content
 * </yunke-tooltip>
 * `
 * ```
 */
export class Tooltip extends LitElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  private _hoverController!: HoverController;

  private readonly _setUpHoverController = () => {
    this._hoverController = new HoverController(
      this,
      () => {
        // const parentElement = this.parentElement;
        // if (
        //   parentElement &&
        //   'disabled' in parentElement &&
        //   parentElement.disabled
        // )
        //   return null;
        if (this.hidden) return null;
        let arrowStyles: StyleInfo = {};
        let tooltipStyles: StyleInfo = {};
        return {
          template: ({ positionSlot, updatePortal }) => {
            positionSlot.subscribe(data => {
              // The tooltip placement may change,
              // so we need to update the arrow position
              if (this.arrow) {
                arrowStyles = updateArrowStyles(data);
              } else {
                arrowStyles = {};
              }

              if (this.autoHide) {
                tooltipStyles.visibility = data.middlewareData.hide
                  ?.referenceHidden
                  ? 'hidden'
                  : '';
                arrowStyles.visibility = tooltipStyles.visibility;
              }

              updatePortal();
            });

            const children = Array.from(this.childNodes).map(node =>
              node.cloneNode(true)
            );

            return html`
              <style>
                ${this._getStyles()}
              </style>
              <div
                class="yunke-tooltip"
                role="tooltip"
                style=${styleMap(tooltipStyles)}
              >
                ${children}
              </div>
              <div class="arrow" style=${styleMap(arrowStyles)}></div>
            `;
          },
          computePosition: portalRoot => ({
            referenceElement: this.parentElement!,
            placement: this.placement,
            middleware: [
              this.autoFlip && flip({ padding: AUTO_FLIP_PADDING }),
              this.autoShift && shift({ padding: AUTO_SHIFT_PADDING }),
              offset((this.arrow ? TRIANGLE_HEIGHT : 0) + this.offset),
              arrow({
                element: portalRoot.shadowRoot!.querySelector('.arrow')!,
              }),
              this.autoHide && hide({ strategy: 'referenceHidden' }),
            ],
            autoUpdate: true,
          }),
        };
      },
      {
        leaveDelay: 0,
        // The tooltip is not interactive by default
        safeBridge: false,
        allowMultiple: true,
        ...this.hoverOptions,
      }
    );

    const parent = this.parentElement;
    if (!parent) {
      console.error('Tooltip must have a parent element');
      return;
    }

    // Wait for render
    requestConnectedFrame(() => {
      this._hoverController.setReference(parent);
    }, this);
  };

  private _getStyles() {
    return css`
      ${styles}
      :host {
        z-index: ${unsafeCSS(this.zIndex)};
        opacity: 0;
        // All the styles are applied to the portal element
        ${unsafeCSS(this.style.cssText)}
      }

      ${this.allowInteractive
        ? css``
        : css`
            :host {
              pointer-events: none;
            }
          `}

      ${this.tooltipStyle}
    `;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._setUpHoverController();
  }

  getPortal() {
    return this._hoverController.portal;
  }

  /**
   * Allow the tooltip to be interactive.
   * eg. allow the user to select text in the tooltip.
   */
  @property({ attribute: false })
  accessor allowInteractive = false;

  /**
   * Show a triangle arrow pointing to the reference element.
   */
  @property({ attribute: false })
  accessor arrow = true;

  /**
   * changes the placement of the floating element in order to keep it in view,
   * with the ability to flip to any placement.
   *
   * See https://floating-ui.com/docs/flip
   */
  @property({ attribute: false })
  accessor autoFlip = true;

  /**
   * Hide the tooltip when the reference element is not in view.
   *
   * See https://floating-ui.com/docs/hide
   */
  @property({ attribute: false })
  accessor autoHide = false;

  /**
   * shifts the floating element to keep it in view.
   * this prevents the floating element from
   * overflowing along its axis of alignment,
   * thereby preserving the side it’s placed on.
   *
   * See https://floating-ui.com/docs/shift
   */
  @property({ attribute: false })
  accessor autoShift = false;

  @property({ attribute: false })
  accessor hoverOptions: Partial<HoverOptions> = {};

  /**
   * Default is `4px`
   *
   * See https://floating-ui.com/docs/offset
   */
  @property({ attribute: false })
  accessor offset = 4;

  @property({ attribute: 'tip-position' })
  accessor placement: Placement = 'top';

  @property({ attribute: false })
  accessor tooltipStyle: CSSResult = css``;

  @property({ attribute: false })
  accessor zIndex: number | string = 'var(--yunke-z-index-popover)';
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-tooltip': Tooltip;
  }
}

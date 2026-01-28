import { html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  ratingCellStyle,
  ratingContainerStyle,
  ratingEmptyStyle,
  ratingFilledStyle,
  ratingHalfInnerStyle,
  ratingHalfStyle,
  ratingStarReadonlyStyle,
  ratingStarStyle,
} from './cell-renderer-css.js';
import { ratingPropertyModelConfig } from './define.js';

interface RatingPropertyData {
  maxRating: number;
  allowHalf: boolean;
  color: string;
}

export class RatingCell extends BaseCellRenderer<
  number,
  number,
  RatingPropertyData
> {
  get _value() {
    return this.isEditing$.value
      ? (this.tempValue ?? this.value ?? 0)
      : (this.value ?? 0);
  }

  get _maxRating() {
    return this.propertyData?.maxRating ?? 5;
  }

  get _allowHalf() {
    return this.propertyData?.allowHalf ?? false;
  }

  get _color() {
    return this.propertyData?.color ?? '#fadb14';
  }

  private _handleClick(starIndex: number, isHalf: boolean = false) {
    if (!this.isEditing$.value) return;

    let newValue: number;
    if (this._allowHalf && isHalf) {
      newValue = starIndex + 0.5;
    } else {
      newValue = starIndex + 1;
    }

    // 点击已选中的值时清除评分
    if (newValue === this._value) {
      newValue = 0;
    }

    this.tempValue = newValue;
  }

  private _handleMouseMove(e: MouseEvent, starIndex: number) {
    if (!this.isEditing$.value || !this._allowHalf) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    this.hoverValue = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
  }

  private _handleMouseLeave() {
    this.hoverValue = undefined;
  }

  override beforeExitEditingMode() {
    const value = this._value;
    this.valueSetNextTick(value);
  }

  private _renderStar(index: number) {
    const currentValue = this.hoverValue ?? this._value;
    const isFilled = currentValue >= index + 1;
    const isHalfFilled = this._allowHalf && currentValue === index + 0.5;
    const isEmpty = !isFilled && !isHalfFilled;

    const starClass = this.isEditing$.value
      ? ratingStarStyle
      : ratingStarReadonlyStyle;

    const colorStyle = styleMap({
      color: isEmpty ? undefined : this._color,
    });

    if (isHalfFilled) {
      // 半星渲染
      return html`
        <span
          class="${starClass} ${ratingHalfStyle}"
          @click=${(e: MouseEvent) => {
            const target = e.currentTarget as HTMLElement;
            const rect = target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const isLeftHalf = x < rect.width / 2;
            this._handleClick(index, isLeftHalf);
          }}
          @mousemove=${(e: MouseEvent) => this._handleMouseMove(e, index)}
          @mouseleave=${() => this._handleMouseLeave()}
        >
          <span class="${ratingEmptyStyle}">☆</span>
          <span class="${ratingHalfInnerStyle}" style=${colorStyle}>★</span>
        </span>
      `;
    }

    return html`
      <span
        class="${starClass} ${isFilled ? ratingFilledStyle : ratingEmptyStyle}"
        style=${isFilled ? colorStyle : nothing}
        @click=${(e: MouseEvent) => {
          if (this._allowHalf) {
            const target = e.currentTarget as HTMLElement;
            const rect = target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const isLeftHalf = x < rect.width / 2;
            this._handleClick(index, isLeftHalf);
          } else {
            this._handleClick(index);
          }
        }}
        @mousemove=${(e: MouseEvent) => this._handleMouseMove(e, index)}
        @mouseleave=${() => this._handleMouseLeave()}
      >
        ${isFilled ? '★' : '☆'}
      </span>
    `;
  }

  protected override render() {
    const stars = Array.from({ length: this._maxRating }, (_, i) => i);

    return html`
      <div class="${ratingCellStyle}">
        <div class="${ratingContainerStyle}">
          ${repeat(
            stars,
            i => i,
            i => this._renderStar(i)
          )}
        </div>
      </div>
    `;
  }

  @state()
  private accessor tempValue: number | undefined = undefined;

  @state()
  private accessor hoverValue: number | undefined = undefined;
}

export const ratingPropertyConfig = ratingPropertyModelConfig.createPropertyMeta(
  {
    icon: createIcon('FavoritedIcon'),
    cellRenderer: {
      view: createFromBaseCellRenderer(RatingCell),
    },
  }
);

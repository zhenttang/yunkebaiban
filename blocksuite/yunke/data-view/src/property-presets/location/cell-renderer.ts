import { LocateIcon } from '@blocksuite/icons/lit';
import { html, nothing } from 'lit';
import { state } from 'lit/decorators.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  locationButtonStyle,
  locationCellStyle,
  locationCoordsStyle,
  locationEmptyStyle,
  locationIconStyle,
  locationInputContainerStyle,
  locationInputStyle,
  locationLinkStyle,
  locationTextStyle,
} from './cell-renderer-css.js';
import { locationPropertyModelConfig, type LocationValue } from './define.js';

interface LocationPropertyData {
  showMap: boolean;
  defaultZoom: number;
}

export class LocationCell extends BaseCellRenderer<
  LocationValue | null,
  LocationValue | null,
  LocationPropertyData
> {
  get _value(): LocationValue | null {
    return this.value ?? null;
  }

  private _formatLocation(): string {
    const location = this._value;
    if (!location) return '';
    
    if (location.address) return location.address;
    if (location.name) return location.name;
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  private _getMapUrl(): string {
    const location = this._value;
    if (!location) return '';
    
    // 使用高德地图 Web 端链接
    const { latitude, longitude } = location;
    return `https://uri.amap.com/marker?position=${longitude},${latitude}&name=${encodeURIComponent(location.name || location.address || '位置')}`;
  }

  private _handleOpenMap() {
    const url = this._getMapUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  private _getCurrentLocation() {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.valueSetNextTick({
          latitude,
          longitude,
        });
        this._inputValue = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  }

  private _handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this._inputValue = input.value;
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._saveAndExit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      this._inputValue = '';
      this.selectCurrentCell(false);
    }
  }

  private _saveAndExit() {
    const input = this._inputValue.trim();
    if (!input) {
      this.valueSetNextTick(null);
    } else {
      // 尝试解析坐标
      const parts = input.split(',').map(s => s.trim());
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          this.valueSetNextTick({
            latitude: lat,
            longitude: lng,
          });
        }
      }
    }
    this.selectCurrentCell(false);
  }

  override beforeExitEditingMode() {
    this._saveAndExit();
  }

  protected override render() {
    const location = this._value;

    // 编辑模式
    if (this.isEditing$.value) {
      return html`
        <div class="${locationCellStyle}">
          <div class="${locationInputContainerStyle}">
            <input
              class="${locationInputStyle}"
              type="text"
              .value=${this._inputValue || this._formatLocation()}
              placeholder="输入坐标 (纬度, 经度)"
              @input=${this._handleInput}
              @keydown=${this._handleKeydown}
            />
            <button
              class="${locationButtonStyle}"
              @click=${() => this._getCurrentLocation()}
            >
              <span class="${locationIconStyle}">${LocateIcon()}</span>
              获取当前位置
            </button>
          </div>
        </div>
      `;
    }

    // 只读模式 - 空值
    if (!location) {
      return html`
        <div class="${locationCellStyle}">
          <span class="${locationEmptyStyle}"></span>
        </div>
      `;
    }

    // 只读模式 - 有值
    const displayText = this._formatLocation();
    const hasAddress = !!location.address || !!location.name;

    return html`
      <div class="${locationCellStyle}">
        <a
          class="${locationLinkStyle}"
          href=${this._getMapUrl()}
          target="_blank"
          @click=${(e: Event) => {
            e.preventDefault();
            this._handleOpenMap();
          }}
        >
          <span class="${locationIconStyle}">${LocateIcon()}</span>
          <span class="${locationTextStyle}">${displayText}</span>
        </a>
        ${!hasAddress
          ? nothing
          : html`
              <span class="${locationCoordsStyle}">
                (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})
              </span>
            `
        }
      </div>
    `;
  }

  @state()
  private accessor _inputValue = '';
}

export const locationPropertyConfig = locationPropertyModelConfig.createPropertyMeta({
  icon: createIcon('LocateIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(LocationCell),
  },
});

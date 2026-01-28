import {
  AttachmentIcon,
  CloseIcon,
  ImageIcon,
  PlusIcon,
} from '@blocksuite/icons/lit';
import { html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  attachmentAddButtonStyle,
  attachmentCellStyle,
  attachmentDeleteButtonStyle,
  attachmentEmptyStyle,
  attachmentIconStyle,
  attachmentItemStyle,
  attachmentNameStyle,
  attachmentSizeStyle,
  attachmentThumbnailStyle,
} from './cell-renderer-css.js';
import {
  attachmentPropertyModelConfig,
  type AttachmentItem,
} from './define.js';

interface AttachmentPropertyData {
  maxSize: number;
  allowedTypes: string[];
}

export class AttachmentCell extends BaseCellRenderer<
  AttachmentItem[],
  AttachmentItem[],
  AttachmentPropertyData
> {
  get _value(): AttachmentItem[] {
    return this.value ?? [];
  }

  private _formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private _isImage(type: string): boolean {
    return type.startsWith('image/');
  }

  private _handleFileSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    const allowedTypes = this.propertyData?.allowedTypes ?? [];
    if (allowedTypes.length > 0) {
      input.accept = allowedTypes.join(',');
    }

    input.onchange = async () => {
      const files = input.files;
      if (!files || files.length === 0) return;

      const maxSize = this.propertyData?.maxSize ?? 10 * 1024 * 1024;
      const newItems: AttachmentItem[] = [];

      for (const file of Array.from(files)) {
        if (file.size > maxSize) {
          console.warn(`文件 ${file.name} 超过大小限制`);
          continue;
        }

        // 创建临时 URL（实际项目中应该上传到服务器）
        const url = URL.createObjectURL(file);
        
        const item: AttachmentItem = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: url,
          thumbnailUrl: this._isImage(file.type) ? url : undefined,
          uploadedAt: Date.now(),
        };

        newItems.push(item);
      }

      if (newItems.length > 0) {
        const currentValue = this._value;
        this.valueSetNextTick([...currentValue, ...newItems]);
      }
    };

    input.click();
  };

  private _handleDelete(id: string) {
    const newValue = this._value.filter(item => item.id !== id);
    this.valueSetNextTick(newValue);
  }

  private _handleItemClick(item: AttachmentItem) {
    // 打开文件预览或下载
    window.open(item.url, '_blank');
  }

  private _renderItem(item: AttachmentItem) {
    const isImage = this._isImage(item.type);
    
    return html`
      <div class="${attachmentItemStyle}" @click=${() => this._handleItemClick(item)}>
        ${isImage && item.thumbnailUrl
          ? html`<img class="${attachmentThumbnailStyle}" src="${item.thumbnailUrl}" alt="${item.name}" />`
          : html`<span class="${attachmentIconStyle}">${isImage ? ImageIcon() : AttachmentIcon()}</span>`
        }
        <span class="${attachmentNameStyle}" title="${item.name}">${item.name}</span>
        <span class="${attachmentSizeStyle}">${this._formatSize(item.size)}</span>
        ${this.isEditing$.value
          ? html`
              <span 
                class="${attachmentDeleteButtonStyle}" 
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._handleDelete(item.id);
                }}
              >
                ${CloseIcon()}
              </span>
            `
          : nothing
        }
      </div>
    `;
  }

  protected override render() {
    const items = this._value;

    if (items.length === 0 && !this.isEditing$.value) {
      return html`
        <div class="${attachmentCellStyle}">
          <span class="${attachmentEmptyStyle}"></span>
        </div>
      `;
    }

    return html`
      <div class="${attachmentCellStyle}">
        ${repeat(
          items,
          item => item.id,
          item => this._renderItem(item)
        )}
        ${this.isEditing$.value
          ? html`
              <div class="${attachmentAddButtonStyle}" @click=${this._handleFileSelect}>
                ${PlusIcon()}
              </div>
            `
          : nothing
        }
      </div>
    `;
  }

  @state()
  private accessor _uploading = false;
}

export const attachmentPropertyConfig =
  attachmentPropertyModelConfig.createPropertyMeta({
    icon: createIcon('AttachmentIcon'),
    cellRenderer: {
      view: createFromBaseCellRenderer(AttachmentCell),
    },
  });

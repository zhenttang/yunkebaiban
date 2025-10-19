import { ConfirmIcon } from '@blocksuite/yunke-components/icons';
import { toast } from '@blocksuite/yunke-components/toast';
import type { AttachmentBlockModel } from '@blocksuite/yunke-model';
import type { EditorHost } from '@blocksuite/std';
import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';

import { renameStyles } from './styles';

export const RenameModal = ({
  editorHost,
  model,
  abortController,
}: {
  editorHost: EditorHost;
  model: AttachmentBlockModel;
  abortController: AbortController;
}) => {
  const inputRef = createRef<HTMLInputElement>();
  // Fix auto focus
  setTimeout(() => inputRef.value?.focus());
  const originalName = model.props.name;
  const nameWithoutExtension = originalName.slice(
    0,
    originalName.lastIndexOf('.')
  );
  const originalExtension = originalName.slice(originalName.lastIndexOf('.'));
  const includeExtension =
    originalExtension.includes('.') &&
    originalExtension.length <= 7 &&
    // including the dot
    originalName.length > originalExtension.length;

  let fileName = includeExtension ? nameWithoutExtension : originalName;
  const extension = includeExtension ? originalExtension : '';

  const abort = () => abortController.abort();
  const onConfirm = () => {
    const newFileName = fileName + extension;
    if (!newFileName) {
      toast(editorHost, '文件名不能为空');
      return;
    }
    model.store.updateBlock(model, {
      name: newFileName,
    });
    abort();
  };
  const onInput = (e: InputEvent) => {
    fileName = (e.target as HTMLInputElement).value;
  };
  const onKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Escape' && !e.isComposing) {
      abort();
      return;
    }
    if (e.key === 'Enter' && !e.isComposing) {
      onConfirm();
      return;
    }
  };

  return html`
    <style>
      ${renameStyles}
    </style>
    <div class="affine-attachment-rename-overlay-mask" @click="${abort}"></div>
    <div class="affine-attachment-rename-container">
      <div class="affine-attachment-rename-input-wrapper">
        <input
          ${ref(inputRef)}
          type="text"
          .value=${fileName}
          @input=${onInput}
          @keydown=${onKeydown}
        />
        <span class="affine-attachment-rename-extension">${extension}</span>
      </div>
      <editor-icon-button
        class="affine-confirm-button"
        .iconSize=${'24px'}
        @click=${onConfirm}
      >
        ${ConfirmIcon}
      </editor-icon-button>
    </div>
  `;
};

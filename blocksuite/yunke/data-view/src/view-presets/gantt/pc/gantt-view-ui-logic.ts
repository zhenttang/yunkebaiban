import { html } from 'lit/static-html.js';
import type { TemplateResult } from 'lit';
import type { InsertToPosition } from '@blocksuite/yunke-shared/utils';

import {
  createUniComponentFromWebComponent,
  DataViewUIBase,
  DataViewUILogicBase,
} from '../../../core/index.js';
import type { DataViewRootUILogic } from '../../../core/data-view.js';
import type { GanttSingleView } from '../gantt-view-manager.js';
import '../gantt-view.js'; // 引入甘特图主组件

/**
 * 甘特图视图 UI 逻辑（桌面端）
 */
export class GanttViewUILogic extends DataViewUILogicBase<GanttSingleView, any> {
  override type = 'gantt' as const;

  constructor(root: DataViewRootUILogic, view: GanttSingleView) {
    super(root, view);
  }

  clearSelection = (): void => {
    // Clear any selected tasks or timeline selections
  };

  addRow = (position: InsertToPosition): string | undefined => {
    // Add a new row/task to the gantt chart
    return this.view.rowAdd(position);
  };

  focusFirstCell = (): void => {
    // Focus the first cell in the gantt view
  };

  showIndicator = (evt: MouseEvent): boolean => {
    // Show drop indicator for drag operations
    return false;
  };

  hideIndicator = (): void => {
    console.log('👁️‍🗨️ [GanttViewUILogic] Hide indicator called');
    // Hide drop indicator
  };

  moveTo = (id: string, evt: MouseEvent): void => {
    console.log('🚚 [GanttViewUILogic] Move to called with id:', id);
    // Move row to a different position
  };

  renderer = createUniComponentFromWebComponent(GanttViewUI);
}

/**
 * 甘特图视图 UI 组件（桌面端）
 */
export class GanttViewUI extends DataViewUIBase<GanttViewUILogic> {
  override connectedCallback(): void {
    super.connectedCallback();
    console.log('🔌 [GanttViewUI] Connected callback called, logic:', this.logic);
    this.classList.add('affine-database-gantt');
    this.dataset['testid'] = 'dv-gantt-view';
  }

  override render(): TemplateResult {
    console.log('🎨 [GanttViewUI] Render called, view:', this.logic?.view);
    
    // 检查 gantt-view 元素是否已注册
    const isRegistered = customElements.get('gantt-view');
    console.log('🔍 [GanttViewUI] gantt-view element registered:', !!isRegistered);
    
    if (!isRegistered) {
      console.error('❌ [GanttViewUI] gantt-view element is not registered!');
      return html`<div style="color: red; padding: 20px;">
        Error: gantt-view element is not registered
      </div>`;
    }
    
    return html`
      <gantt-view
        .view=${this.logic.view}
        .readonly=${this.logic.view.readonly$.value}
      ></gantt-view>
    `;
  }
}
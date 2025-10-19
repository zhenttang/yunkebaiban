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
 * 甘特图视图 UI 逻辑（移动端）
 */
export class MobileGanttViewUILogic extends DataViewUILogicBase<GanttSingleView, any> {
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
    // Hide drop indicator
  };

  moveTo = (id: string, evt: MouseEvent): void => {
    // Move row to a different position
  };

  renderer = createUniComponentFromWebComponent(MobileGanttViewUI);
}

/**
 * 甘特图视图 UI 组件（移动端）
 */
export class MobileGanttViewUI extends DataViewUIBase<MobileGanttViewUILogic> {
  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('affine-database-gantt-mobile');
    this.dataset['testid'] = 'dv-gantt-view-mobile';
  }

  override render(): TemplateResult {
    // 移动端使用相同的甘特图組件，但适配移动端样式
    return html`
      <gantt-view
        .view=${this.logic.view}
        .readonly=${this.logic.view.readonly$.value}
        style="--gantt-row-height: 36px; font-size: 13px;"
      ></gantt-view>
    `;
  }
}
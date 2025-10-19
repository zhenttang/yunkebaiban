import { EdgelessFrameManagerIdentifier } from '@blocksuite/yunke-block-frame';
import {
  EdgelessCRUDIdentifier,
  getSurfaceComponent,
} from '@blocksuite/yunke-block-surface';
import { ConnectorTool } from '@blocksuite/yunke-gfx-connector';
import {
  createGroupCommand,
  createGroupFromSelectedCommand,
  ungroupCommand,
} from '@blocksuite/yunke-gfx-group';
import {
  ConnectorElementModel,
  DEFAULT_CONNECTOR_MODE,
  GroupElementModel,
  MindmapElementModel,
} from '@blocksuite/yunke-model';
import {
  ActionPlacement,
  type ElementLockEvent,
  type ToolbarAction,
  type ToolbarContext,
  type ToolbarModuleConfig,
} from '@blocksuite/yunke-shared/services';
import { Bound } from '@blocksuite/global/gfx';
import {
  AlignLeftIcon,
  ConnectorCIcon,
  FrameIcon,
  GroupingIcon,
  LockIcon,
  ReleaseFromGroupIcon,
  UnlockIcon,
} from '@blocksuite/icons/lit';
import type { GfxModel } from '@blocksuite/std/gfx';
import { html } from 'lit';

import { renderAlignmentMenu } from './alignment';
import { moreActions } from './more';

export const builtinMiscToolbarConfig = {
  actions: [
    {
      placement: ActionPlacement.Start,
      id: 'a.release-from-group',
      tooltip: '从组中释放',
      icon: ReleaseFromGroupIcon(),
      when(ctx) {
        const models = ctx.getSurfaceModels();
        if (models.length !== 1) return false;
        return ctx.matchModel(models[0].group, GroupElementModel);
      },
      run(ctx) {
        const models = ctx.getSurfaceModels();
        if (models.length !== 1) return;

        const firstModel = models[0];
        if (firstModel.isLocked()) return;
        if (!ctx.matchModel(firstModel.group, GroupElementModel)) return;

        const group = firstModel.group;

        // oxlint-disable-next-line unicorn/prefer-dom-node-remove
        group.removeChild(firstModel);

        firstModel.index = ctx.gfx.layer.generateIndex();

        const parent = group.group;
        if (parent && parent instanceof GroupElementModel) {
          parent.addChild(firstModel);
        }
      },
    },
    {
      placement: ActionPlacement.Start,
      id: 'b.add-frame',
      label: '框架',
      showLabel: true,
      tooltip: '框架',
      icon: FrameIcon(),
      when(ctx) {
        const models = ctx.getSurfaceModels();
        if (models.length < 2) return false;
        if (
          models.some(model => ctx.matchModel(model.group, MindmapElementModel))
        )
          return false;
        if (
          models.length ===
          models.filter(model => model instanceof ConnectorElementModel).length
        )
          return false;

        return true;
      },
      run(ctx) {
        const models = ctx.getSurfaceModels();
        if (models.length < 2) return;

        const surface = getSurfaceComponent(ctx.std);
        if (!surface) return;

        const frameManager = ctx.std.get(EdgelessFrameManagerIdentifier);

        const frame = frameManager.createFrameOnSelected();
        if (!frame) return;

        // TODO(@fundon): should be a command
        surface.fitToViewport(Bound.deserialize(frame.xywh));

        ctx.track('CanvasElementAdded', {
          control: 'context-menu',
          type: 'frame',
        });
      },
    },
    {
      placement: ActionPlacement.Start,
      id: 'c.add-group',
      label: '组',
      showLabel: true,
      tooltip: '组',
      icon: GroupingIcon(),
      when(ctx) {
        const models = ctx.getSurfaceModels();
        if (models.length < 2) return false;
        if (ctx.matchModel(models[0], GroupElementModel)) return false;
        if (
          models.some(model => ctx.matchModel(model.group, MindmapElementModel))
        )
          return false;
        if (
          models.length ===
          models.filter(model => ctx.matchModel(model, ConnectorElementModel))
            .length
        )
          return false;

        return true;
      },
      run(ctx) {
        const models = ctx.getSurfaceModels();
        if (models.length < 2) return;

        // TODO(@fundon): should be a command
        ctx.command.exec(createGroupFromSelectedCommand);
      },
    },
    {
      placement: ActionPlacement.Start,
      id: 'd.alignment',
      when(ctx) {
        const models = ctx.getSurfaceModels();
        if (models.length < 2) return false;
        if (models.some(model => model.group instanceof MindmapElementModel))
          return false;
        if (
          models.length ===
          models.filter(model => model instanceof ConnectorElementModel).length
        )
          return false;

        return true;
      },
      content(ctx) {
        const models = ctx.getSurfaceModels();
        if (models.length < 2) return null;

        return renderAlignmentMenu(ctx, models, {
          icon: AlignLeftIcon(),
          label: '对齐对象',
          tooltip: '对齐对象',
        });
      },
    },
    {
      placement: ActionPlacement.End,
      id: 'a.draw-connector',
      label: '绘制连接线',
      tooltip: '绘制连接线',
      icon: ConnectorCIcon(),
      when(ctx) {
        const models = ctx.getSurfaceModels();
        if (models.length !== 1) return false;
        return !ctx.matchModel(models[0], ConnectorElementModel);
      },
      content(ctx) {
        const models = ctx.getSurfaceModels();
        if (!models.length) return null;

        const { label, icon, tooltip } = this;

        const quickConnect = (e: MouseEvent) => {
          e.stopPropagation();

          const { x, y } = e;
          const point = ctx.gfx.viewport.toViewCoordFromClientCoord([x, y]);

          ctx.store.captureSync();
          ctx.gfx.tool.setTool(ConnectorTool, { mode: DEFAULT_CONNECTOR_MODE });

          const ctc = ctx.gfx.tool.get(ConnectorTool);
          ctc.quickConnect(point, models[0]);
        };

        return html`
          <editor-icon-button
            data-testid="${'draw-connector'}"
            aria-label=${label}
            .tooltip=${tooltip}
            @click=${quickConnect}
          >
            ${icon}
          </editor-icon-button>
        `;
      },
    } satisfies ToolbarAction,
    {
      placement: ActionPlacement.End,
      id: 'b.lock',
      tooltip: '锁定',
      icon: LockIcon(),
      run(ctx) {
        const models = ctx.getSurfaceModels();
        if (!models.length) return;

        // get most top selected elements(*) from tree, like in a tree below
        //         G0
        //        /  \
        //      E1*  G1
        //          /  \
        //        E2*  E3*
        //
        // (*) selected elements, [E1, E2, E3]
        // return [E1]

        const elements = Array.from(
          new Set(
            models.map(model =>
              ctx.matchModel(model.group, MindmapElementModel)
                ? model.group
                : model
            )
          )
        );

        const levels = elements.map(element => element.groups.length);
        const topElement = elements[levels.indexOf(Math.min(...levels))];
        const otherElements = elements.filter(
          element => element !== topElement
        );

        ctx.store.captureSync();

        // release other elements from their groups and group with top element
        otherElements.forEach(element => {
          // oxlint-disable-next-line unicorn/prefer-dom-node-remove
          element.group?.removeChild(element);
          topElement.group?.addChild(element);
        });

        if (otherElements.length === 0) {
          topElement.lock();

          ctx.gfx.selection.set({
            editing: false,
            elements: [topElement.id],
          });

          track(ctx, topElement, 'lock');
          return;
        }

        const [_, { groupId }] = ctx.command.exec(createGroupCommand, {
          elements: [topElement, ...otherElements],
        });

        if (groupId) {
          const element = ctx.std
            .get(EdgelessCRUDIdentifier)
            .getElementById(groupId);

          if (element) {
            element.lock();
            ctx.gfx.selection.set({
              editing: false,
              elements: [groupId],
            });

            track(ctx, element, 'group-lock');
            return;
          }
        }

        for (const element of elements) {
          element.lock();

          track(ctx, element, 'lock');
        }

        ctx.gfx.selection.set({
          editing: false,
          elements: elements.map(e => e.id),
        });
      },
    },

    // More actions
    ...moreActions.map(action => ({
      ...action,
      placement: ActionPlacement.More,
    })),
  ],
  when(ctx) {
    const models = ctx.getSurfaceModels();
    return models.length > 0 && !models.some(model => model.isLocked());
  },
} as const satisfies ToolbarModuleConfig;

export const builtinLockedToolbarConfig = {
  actions: [
    {
      placement: ActionPlacement.End,
      id: 'b.unlock',
      label: '长按解锁',
      showLabel: true,
      icon: UnlockIcon(),
      content(ctx) {
        const models = ctx.getSurfaceModels();
        if (!models.length) return null;

        const { label, icon } = this;
        let isHolding = false;
        let progress = 0;
        let animationId: number | null = null;
        let holdTimeout: number | null = null;
        const HOLD_DURATION = 2000; // 2秒长按时间

        const executeUnlock = () => {
          const elements = new Set(
            models.map(model =>
              ctx.matchModel(model.group, MindmapElementModel)
                ? model.group
                : model
            )
          );

          ctx.store.captureSync();

          for (const element of elements) {
            if (element instanceof GroupElementModel) {
              ctx.command.exec(ungroupCommand, { group: element });
            } else {
              element.lockedBySelf = false;
            }

            track(ctx, element, 'unlock');
          }
        };

        const updateProgress = (buttonEl: HTMLElement) => {
          if (!isHolding) return;
          
          progress = Math.min(progress + 16 / HOLD_DURATION, 1); // 16ms per frame
          const percentage = Math.round(progress * 100);
          
          // 更新进度条宽度
          const progressBar = buttonEl.querySelector('.unlock-progress') as HTMLElement;
          if (progressBar) {
            progressBar.style.width = `${percentage}%`;
          }
          
          // 更新百分比文字
          const progressText = buttonEl.querySelector('.progress-text') as HTMLElement;
          if (progressText) {
            progressText.textContent = `${percentage}%`;
          }
          
          // 更新文字颜色
          const textEl = buttonEl.querySelector('.unlock-text') as HTMLElement;
          if (textEl) {
            const intensity = progress;
            textEl.style.color = `rgb(${Math.floor(55 - intensity * 20)}, ${Math.floor(65 + intensity * 90)}, ${Math.floor(81 - intensity * 40)})`;
          }
          
          if (progress >= 1) {
            // 解锁完成
            executeUnlock();
            resetProgress(buttonEl);
          } else {
            animationId = requestAnimationFrame(() => updateProgress(buttonEl));
          }
        };

        const resetProgress = (buttonEl: HTMLElement) => {
          isHolding = false;
          progress = 0;
          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }
          if (holdTimeout) {
            clearTimeout(holdTimeout);
            holdTimeout = null;
          }
          
          // 重置进度条宽度
          const progressBar = buttonEl.querySelector('.unlock-progress') as HTMLElement;
          if (progressBar) {
            progressBar.style.width = '0%';
          }
          
          // 重置百分比文字
          const progressText = buttonEl.querySelector('.progress-text') as HTMLElement;
          if (progressText) {
            progressText.textContent = '0%';
          }
          
          // 重置文字颜色
          const textEl = buttonEl.querySelector('.unlock-text') as HTMLElement;
          if (textEl) {
            textEl.style.color = '#374151';
          }
        };

        const handlePointerDown = (e: PointerEvent) => {
          e.stopPropagation();
          e.preventDefault();
          
          const buttonEl = e.currentTarget as HTMLElement;
          isHolding = true;
          progress = 0;
          
          // 开始动画
          updateProgress(buttonEl);
          
          // 添加全局释放监听器
          const handlePointerUp = () => {
            resetProgress(buttonEl);
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('pointercancel', handlePointerUp);
          };
          
          document.addEventListener('pointerup', handlePointerUp);
          document.addEventListener('pointercancel', handlePointerUp);
        };

        return html`
          <div
            style="
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.95);
              border: 1px solid rgba(0, 0, 0, 0.1);
              border-radius: 20px;
              cursor: pointer;
              user-select: none;
              backdrop-filter: blur(8px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;
              min-width: 100px;
            "
            @pointerdown=${handlePointerDown}
            @contextmenu=${(e: Event) => e.preventDefault()}
            @mouseenter=${(e: Event) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1.02)';
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            @mouseleave=${(e: Event) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1)';
              target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <!-- 图标 - 使用简单的🔓 emoji -->
            <div style="
              width: 18px; 
              height: 18px; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              opacity: 0.8;
              font-size: 14px;
            ">
              🔓
            </div>
            
            <!-- 进度条和文字 -->
            <div style="
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 4px;
            ">
              <!-- 文字 -->
              <div
                class="unlock-text"
                style="
                  font-size: 12px;
                  font-weight: 500;
                  color: #374151;
                  line-height: 1;
                  transition: color 0.2s ease;
                "
              >${label}</div>
              
              <!-- 进度条背景 -->
              <div style="
                width: 100%;
                height: 4px;
                background: rgba(0, 0, 0, 0.08);
                border-radius: 2px;
                overflow: hidden;
                position: relative;
              ">
                <!-- 进度条填充 -->
                <div
                  class="unlock-progress"
                  style="
                    height: 100%;
                    width: 0%;
                    background: linear-gradient(90deg, #10b981, #34d399);
                    border-radius: 2px;
                    transition: width 0.15s ease-out;
                    position: relative;
                  "
                ></div>
              </div>
            </div>
            
            <!-- 百分比 -->
            <div
              class="progress-text"
              style="
                font-size: 11px;
                color: #6b7280;
                font-weight: 600;
                min-width: 28px;
                text-align: right;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
              "
            >0%</div>
          </div>
        `;
      },
    },
  ],
  when: ctx => ctx.getSurfaceModels().some(model => model.isLocked()),
} as const satisfies ToolbarModuleConfig;

function track(
  ctx: ToolbarContext,
  element: GfxModel,
  control: ElementLockEvent['control']
) {
  ctx.track('EdgelessElementLocked', {
    control,
    type:
      'type' in element
        ? element.type
        : (element.flavour.split(':')[1] ?? element.flavour),
  });
}

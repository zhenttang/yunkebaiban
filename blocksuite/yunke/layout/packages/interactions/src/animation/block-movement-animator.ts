/**
 * Block移动动画实现
 * 负责处理Block在列间移动的动画效果
 */

import { DURATION, ANIMATION_PRESETS } from '../types/animation-types';
import { AnimationPath } from '../types/animation-contracts';

/**
 * Block移动动画器
 */
export class BlockMovementAnimator {
  private activeMovements = new Map<string, Animation>();
  
  /**
   * 执行Block移动动画
   */
  async executeMovement(
    block: HTMLElement, 
    fromColumn: number, 
    toColumn: number
  ): Promise<void> {
    const movementId = `block-${block.id || Date.now()}-${fromColumn}-${toColumn}`;
    
    // 如果已有相同Block的移动动画，取消之
    if (this.activeMovements.has(block.id)) {
      this.activeMovements.get(block.id)?.cancel();
    }
    
    try {
      // 计算移动路径
      const path = await this.calculateMovementPath(block, fromColumn, toColumn);
      
      // 创建移动的ghost元素
      const ghost = this.createGhostBlock(block);
      
      // 执行移动动画
      await this.animateBlockAlongPath(ghost, path);
      
      // 清理ghost元素
      ghost.remove();
      
    } catch (error) {
      console.error('Block movement animation failed:', error);
      throw error;
    } finally {
      this.activeMovements.delete(movementId);
    }
  }
  
  /**
   * 计算移动路径
   */
  private async calculateMovementPath(
    block: HTMLElement,
    fromColumn: number,
    toColumn: number
  ): Promise<AnimationPath> {
    const startRect = block.getBoundingClientRect();
    const targetColumn = document.querySelector(`[data-column="${toColumn}"]`);
    
    if (!targetColumn) {
      throw new Error(`Target column ${toColumn} not found`);
    }
    
    // 计算目标位置（列的中心位置）
    const targetRect = targetColumn.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2 - startRect.width / 2;
    const targetY = targetRect.top + 50; // 目标列顶部偏移50px
    
    // 根据距离选择路径类型
    const distance = Math.sqrt(
      Math.pow(targetX - startRect.left, 2) + 
      Math.pow(targetY - startRect.top, 2)
    );
    
    if (distance < 200) {
      // 短距离：直线移动
      return {
        type: 'linear',
        start: { x: startRect.left, y: startRect.top },
        end: { x: targetX, y: targetY }
      };
    } else {
      // 长距离：弧形移动
      return {
        type: 'arc',
        start: { x: startRect.left, y: startRect.top },
        end: { x: targetX, y: targetY },
        controlPoints: [this.calculateArcControlPoint(startRect, { x: targetX, y: targetY })]
      };
    }
  }
  
  /**
   * 计算弧形控制点
   */
  private calculateArcControlPoint(
    startRect: DOMRect, 
    end: { x: number; y: number }
  ): { x: number; y: number } {
    const deltaX = end.x - startRect.left;
    const deltaY = end.y - startRect.top;
    
    // 控制点在中点上方形成弧形
    const midX = startRect.left + deltaX * 0.5;
    const midY = startRect.top + deltaY * 0.5;
    const arcHeight = Math.min(100, Math.abs(deltaX) * 0.3);
    
    return {
      x: midX,
      y: midY - arcHeight
    };
  }
  
  /**
   * 创建Ghost Block元素
   */
  private createGhostBlock(originalBlock: HTMLElement): HTMLElement {
    const ghost = originalBlock.cloneNode(true) as HTMLElement;
    const originalRect = originalBlock.getBoundingClientRect();
    
    // 设置ghost样式
    ghost.style.cssText = `
      position: fixed;
      top: ${originalRect.top}px;
      left: ${originalRect.left}px;
      width: ${originalRect.width}px;
      height: ${originalRect.height}px;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      transform: scale(1.05);
      background: var(--yunke-background-primary-color);
      border: 2px solid var(--yunke-primary-color);
    `;
    
    // 移除可能导致问题的属性
    ghost.removeAttribute('id');
    ghost.classList.add('block-ghost');
    
    // 添加到body
    document.body.appendChild(ghost);
    
    // 隐藏原始Block
    originalBlock.style.opacity = '0.3';
    
    return ghost;
  }
  
  /**
   * 沿路径动画化Block
   */
  private async animateBlockAlongPath(
    ghost: HTMLElement, 
    path: AnimationPath
  ): Promise<void> {
    const movementId = `movement-${Date.now()}`;
    
    try {
      let animation: Animation;
      
      switch (path.type) {
        case 'linear':
          animation = await this.executeLinearMovement(ghost, path);
          break;
          
        case 'arc':
          animation = await this.executeArcMovement(ghost, path);
          break;
          
        case 'bezier':
          animation = await this.executeBezierMovement(ghost, path);
          break;
          
        default:
          throw new Error(`Unsupported path type: ${path.type}`);
      }
      
      this.activeMovements.set(movementId, animation);
      await animation.finished;
      
    } finally {
      this.activeMovements.delete(movementId);
      
      // 恢复原始Block的可见性
      const originalBlock = document.querySelector(`[data-block-id="${ghost.dataset.blockId}"]`) as HTMLElement;
      if (originalBlock) {
        originalBlock.style.opacity = '';
      }
    }
  }
  
  /**
   * 执行线性移动
   */
  private async executeLinearMovement(
    ghost: HTMLElement, 
    path: AnimationPath
  ): Promise<Animation> {
    const keyframes = [
      {
        transform: `translate(${path.start.x}px, ${path.start.y}px) scale(1.05)`,
        opacity: 1
      },
      {
        transform: `translate(${path.end.x}px, ${path.end.y}px) scale(1)`,
        opacity: 0.8
      }
    ];
    
    const animation = ghost.animate(keyframes, {
      duration: DURATION.normal,
      easing: ANIMATION_PRESETS.normal.easing,
      fill: 'forwards'
    });
    
    return animation;
  }
  
  /**
   * 执行弧形移动
   */
  private async executeArcMovement(
    ghost: HTMLElement, 
    path: AnimationPath
  ): Promise<Animation> {
    if (!path.controlPoints || path.controlPoints.length === 0) {
      throw new Error('Arc movement requires control points');
    }
    
    const controlPoint = path.controlPoints[0];
    
    // 使用三个关键帧创建弧形路径
    const keyframes = [
      {
        offset: 0,
        transform: `translate(${path.start.x}px, ${path.start.y}px) scale(1.05) rotate(0deg)`,
        opacity: 1
      },
      {
        offset: 0.5,
        transform: `translate(${controlPoint.x}px, ${controlPoint.y}px) scale(1.1) rotate(5deg)`,
        opacity: 0.9
      },
      {
        offset: 1,
        transform: `translate(${path.end.x}px, ${path.end.y}px) scale(1) rotate(0deg)`,
        opacity: 0.8
      }
    ];
    
    const animation = ghost.animate(keyframes, {
      duration: DURATION.slow,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // ease-out
      fill: 'forwards'
    });
    
    return animation;
  }
  
  /**
   * 执行贝塞尔曲线移动
   */
  private async executeBezierMovement(
    ghost: HTMLElement, 
    path: AnimationPath
  ): Promise<Animation> {
    if (!path.controlPoints || path.controlPoints.length < 2) {
      throw new Error('Bezier movement requires at least 2 control points');
    }
    
    // 创建更复杂的贝塞尔曲线路径
    const steps = 20; // 20个关键帧创建平滑曲线
    const keyframes: Keyframe[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this.calculateBezierPoint(t, path);
      
      keyframes.push({
        offset: t,
        transform: `translate(${point.x}px, ${point.y}px) scale(${1.05 - t * 0.05}) rotate(${Math.sin(t * Math.PI) * 10}deg)`,
        opacity: 1 - t * 0.2
      });
    }
    
    const animation = ghost.animate(keyframes, {
      duration: DURATION.verySlow,
      easing: 'linear', // 因为我们自己控制了曲线
      fill: 'forwards'
    });
    
    return animation;
  }
  
  /**
   * 计算贝塞尔曲线上的点
   */
  private calculateBezierPoint(t: number, path: AnimationPath): { x: number; y: number } {
    if (!path.controlPoints || path.controlPoints.length < 2) {
      // 退回到线性插值
      return {
        x: path.start.x + t * (path.end.x - path.start.x),
        y: path.start.y + t * (path.end.y - path.start.y)
      };
    }
    
    // 三次贝塞尔曲线
    const p0 = path.start;
    const p1 = path.controlPoints[0];
    const p2 = path.controlPoints[1] || path.controlPoints[0];
    const p3 = path.end;
    
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    
    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
  }
  
  /**
   * 取消指定Block的移动动画
   */
  public cancelMovement(blockId: string): void {
    const animation = this.activeMovements.get(blockId);
    if (animation) {
      animation.cancel();
      this.activeMovements.delete(blockId);
    }
  }
  
  /**
   * 取消所有移动动画
   */
  public cancelAllMovements(): void {
    for (const [id, animation] of this.activeMovements) {
      animation.cancel();
    }
    this.activeMovements.clear();
  }
  
  /**
   * 检查是否有移动动画正在进行
   */
  public hasActiveMovements(): boolean {
    return this.activeMovements.size > 0;
  }
}

/**
 * 高级Block移动动画器
 * 提供更丰富的移动效果
 */
export class AdvancedBlockMovementAnimator extends BlockMovementAnimator {
  /**
   * 执行磁性吸附效果
   */
  async executeMagneticMovement(
    block: HTMLElement,
    fromColumn: number,
    toColumn: number
  ): Promise<void> {
    // 添加磁性吸附效果
    const targetColumn = document.querySelector(`[data-column="${toColumn}"]`) as HTMLElement;
    
    if (targetColumn) {
      // 先显示吸附效果
      await this.showMagneticAttraction(targetColumn);
      
      // 然后执行普通移动
      await this.executeMovement(block, fromColumn, toColumn);
      
      // 最后显示放置效果
      await this.showDropEffect(targetColumn);
    }
  }
  
  /**
   * 显示磁性吸引效果
   */
  private async showMagneticAttraction(targetColumn: HTMLElement): Promise<void> {
    const attraction = document.createElement('div');
    attraction.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
      border-radius: inherit;
      pointer-events: none;
      z-index: 1;
    `;
    
    targetColumn.appendChild(attraction);
    
    // 脉冲动画
    await attraction.animate([
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1.1)' },
      { opacity: 0, transform: 'scale(1.2)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    }).finished;
    
    attraction.remove();
  }
  
  /**
   * 显示放置效果
   */
  private async showDropEffect(targetColumn: HTMLElement): Promise<void> {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      background: rgba(59, 130, 246, 0.3);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
    `;
    
    targetColumn.appendChild(ripple);
    
    // 波纹动画
    await ripple.animate([
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(3)', opacity: 0 }
    ], {
      duration: 400,
      easing: 'ease-out'
    }).finished;
    
    ripple.remove();
  }
}
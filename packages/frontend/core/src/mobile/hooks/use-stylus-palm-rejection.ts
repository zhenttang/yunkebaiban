import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 触控笔防误触 Hook
 * 
 * 功能：
 * 1. 检测触控笔使用
 * 2. 使用触控笔时自动忽略手指触摸（防掌触）
 * 3. 超时后自动恢复手指触摸
 */

export interface StylusPalmRejectionOptions {
  /**
   * 启用防误触功能
   * @default true
   */
  enabled?: boolean;

  /**
   * 触控笔输入后，持续忽略手指触摸的时间（毫秒）
   * @default 2000 (2秒)
   */
  timeout?: number;

  /**
   * 连续手指触摸多少次后强制退出防误触模式
   * @default 3
   */
  forceExitTouchCount?: number;

  /**
   * 调试模式：显示当前状态
   * @default false
   */
  debug?: boolean;

  /**
   * 触控笔检测回调
   */
  onStylusDetected?: (isStylus: boolean) => void;

  /**
   * 误触拦截回调
   */
  onTouchRejected?: (event: PointerEvent) => void;
}

export interface StylusPalmRejectionState {
  /** 是否检测到触控笔 */
  hasStylusInput: boolean;
  
  /** 当前是否处于防误触模式 */
  isPalmRejectionActive: boolean;
  
  /** 拦截的手指触摸次数 */
  rejectedTouchCount: number;
  
  /** 触控笔输入次数 */
  stylusInputCount: number;
}

export const useStylusPalmRejection = (
  options: StylusPalmRejectionOptions = {}
) => {
  const {
    enabled = true,
    timeout = 2000, // 缩短为2秒
    forceExitTouchCount = 3, // 连续3次手指触摸强制退出
    debug = false,
    onStylusDetected,
    onTouchRejected,
  } = options;

  const [state, setState] = useState<StylusPalmRejectionState>({
    hasStylusInput: false,
    isPalmRejectionActive: false,
    rejectedTouchCount: 0,
    stylusInputCount: 0,
  });

  const timeoutRef = useRef<number | null>(null);
  const lastStylusTimeRef = useRef<number>(0);
  const consecutiveTouchCountRef = useRef<number>(0);

  // 重置防误触模式
  const deactivatePalmRejection = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPalmRejectionActive: false,
    }));
    
    if (debug) {
      console.log('🟢 [Palm Rejection] 已停用 - 恢复手指触摸');
    }
  }, [debug]);

  // 激活防误触模式
  const activatePalmRejection = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasStylusInput: true,
      isPalmRejectionActive: true,
      stylusInputCount: prev.stylusInputCount + 1,
    }));

    // 重置连续手指触摸计数
    consecutiveTouchCountRef.current = 0;

    // 清除旧的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器（缩短为2秒）
    timeoutRef.current = window.setTimeout(() => {
      deactivatePalmRejection();
    }, timeout);

    lastStylusTimeRef.current = Date.now();

    if (debug) {
      console.log('🔴 [Palm Rejection] 已激活 - 忽略手指触摸', { timeout: `${timeout}ms` });
    }

    onStylusDetected?.(true);
  }, [timeout, debug, deactivatePalmRejection, onStylusDetected]);

  // 全局事件监听
  useEffect(() => {
    if (!enabled) return;

    const handlePointerEvent = (e: PointerEvent) => {
      // 检测到触控笔
      if (e.pointerType === 'pen') {
        activatePalmRejection();
      }
      // 检测到手指触摸
      else if (e.pointerType === 'touch') {
        if (state.isPalmRejectionActive) {
          // 检查距离上次触控笔输入的时间
          const timeSinceStylus = Date.now() - lastStylusTimeRef.current;
          
          // 如果超过1秒没有触控笔输入，累计手指触摸次数
          if (timeSinceStylus > 1000 && e.type === 'pointerdown') {
            consecutiveTouchCountRef.current += 1;
            
            if (debug) {
              console.log('👆 [Palm Rejection] 检测到手指触摸', {
                consecutiveCount: consecutiveTouchCountRef.current,
                forceExitThreshold: forceExitTouchCount,
              });
            }
            
            // 连续手指触摸达到阈值，强制退出防误触模式
            if (consecutiveTouchCountRef.current >= forceExitTouchCount) {
              if (debug) {
                console.log('🔄 [Palm Rejection] 检测到多次手指触摸，强制退出防误触模式');
              }
              deactivatePalmRejection();
              consecutiveTouchCountRef.current = 0;
              return; // 允许这次触摸通过
            }
          }
          
          // 在防误触模式下，阻止手指触摸事件
          e.preventDefault();
          e.stopPropagation();
          
          setState(prev => ({
            ...prev,
            rejectedTouchCount: prev.rejectedTouchCount + 1,
          }));

          if (debug) {
            console.log('❌ [Palm Rejection] 拦截手指触摸', {
              rejectedCount: state.rejectedTouchCount + 1,
              timeSinceStylus,
            });
          }

          onTouchRejected?.(e);
        } else {
          // 不在防误触模式，重置计数
          consecutiveTouchCountRef.current = 0;
        }
      }
    };

    // 监听关键事件
    const events = ['pointerdown', 'pointermove', 'pointerup'] as const;
    
    events.forEach(eventName => {
      document.addEventListener(eventName, handlePointerEvent, {
        capture: true, // 捕获阶段拦截
        passive: false, // 允许 preventDefault
      });
    });

    return () => {
      events.forEach(eventName => {
        document.removeEventListener(eventName, handlePointerEvent, { capture: true } as any);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, state.isPalmRejectionActive, activatePalmRejection, debug, onTouchRejected]);

  // 手动重置
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    consecutiveTouchCountRef.current = 0;
    
    setState({
      hasStylusInput: false,
      isPalmRejectionActive: false,
      rejectedTouchCount: 0,
      stylusInputCount: 0,
    });

    if (debug) {
      console.log('🔄 [Palm Rejection] 已重置');
    }
  }, [debug]);

  // 手动启用/禁用
  const setEnabled = useCallback((enabled: boolean) => {
    if (!enabled) {
      deactivatePalmRejection();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [deactivatePalmRejection]);

  return {
    ...state,
    reset,
    setEnabled,
    activatePalmRejection,
    deactivatePalmRejection,
  };
};


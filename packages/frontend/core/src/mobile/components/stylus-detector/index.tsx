import { Modal } from '@yunke/component';
import { useCallback, useEffect, useRef, useState } from 'react';

import * as styles from './styles.css.js';

interface StylusInfo {
  isStylus: boolean;
  pointerType: string;
  pressure: number;
  tiltX: number;
  tiltY: number;
  deviceType: string;
  timestamp: number;
}

const detectDeviceType = (pointerType: string): string => {
  if (pointerType === 'pen') {
    // 根据特征判断设备类型
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (/iPad|iPhone/.test(ua)) {
        return '🍎 Apple Pencil (iPad)';
      } else if (/Android/.test(ua)) {
        if (/Xiaomi|MI|Redmi/i.test(ua)) {
          return '📱 小米触控笔';
        } else if (/SM-/.test(ua)) {
          return '🖊️ Samsung S Pen';
        } else if (/HUAWEI/.test(ua)) {
          return '📝 华为 M-Pencil';
        }
        return '✍️ 安卓触控笔';
      }
    }
    return '🖊️ 触控笔';
  } else if (pointerType === 'touch') {
    return '👆 手指触摸';
  } else if (pointerType === 'mouse') {
    return '🖱️ 鼠标';
  }
  return '❓ 未知设备';
};

export const StylusDetector = () => {
  const [open, setOpen] = useState(true);
  const [stylusInfo, setStylusInfo] = useState<StylusInfo | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastEventType, setLastEventType] = useState<string>('none');

  const resetDetection = useCallback(() => {
    setStylusInfo(null);
    setDetectionHistory([]);
    setDetectionCount(0);
    setLastEventType('none');
  }, []);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handlePointerEvent = useCallback((e: PointerEvent | React.PointerEvent, shouldPreventDefault = false) => {
    // 只在画板区域阻止默认行为
    if (shouldPreventDefault) {
      e.preventDefault();
    }
    
    const isStylus = e.pointerType === 'pen';
    const deviceType = detectDeviceType(e.pointerType);
    const eventType = (e as any).type || 'unknown';
    
    setLastEventType(eventType);
    
    const info: StylusInfo = {
      isStylus,
      pointerType: e.pointerType,
      pressure: e.pressure,
      tiltX: e.tiltX || 0,
      tiltY: e.tiltY || 0,
      deviceType,
      timestamp: Date.now(),
    };

    setStylusInfo(info);
    setDetectionCount(prev => prev + 1);

    const detectionMsg = `[${eventType}] ${deviceType} - 压感: ${e.pressure.toFixed(3)}`;
    
    setDetectionHistory(prev => {
      const newHistory = [detectionMsg, ...prev];
      return newHistory.slice(0, 10); // 只保留最近10条
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 监听所有类型的指针事件，使用 capture 阶段确保优先捕获
    const events = ['pointerdown', 'pointermove', 'pointerup', 'pointerenter', 'pointerover'] as const;
    
    const handleEvent = (e: PointerEvent) => {
      handlePointerEvent(e, true); // 在画板区域阻止默认行为
    };

    events.forEach(eventName => {
      canvas.addEventListener(eventName, handleEvent, { 
        capture: true,
        passive: false // 允许 preventDefault
      });
    });

    return () => {
      events.forEach(eventName => {
        canvas.removeEventListener(eventName, handleEvent, { capture: true } as any);
      });
    };
  }, [handlePointerEvent]);

  // 全局监听 - 针对触控笔优化（不阻止默认行为）
  useEffect(() => {
    if (!open) return; // 弹窗关闭时不监听
    
    const handleGlobalPointer = (e: Event) => {
      const pointerEvent = e as PointerEvent;
      // 触控笔特别处理：监听所有事件类型
      if (pointerEvent.pointerType === 'pen') {
        handlePointerEvent(pointerEvent, false); // 不阻止默认行为
      } 
      // 手指和鼠标只在按下时记录
      else if (e.type === 'pointerdown') {
        handlePointerEvent(pointerEvent, false); // 不阻止默认行为
      }
    };

    // 监听更多事件类型，确保触控笔能被捕获
    const events = ['pointerdown', 'pointermove', 'pointerup', 'pointerenter', 'pointerover'];
    
    events.forEach(eventName => {
      (document as any).addEventListener(eventName, handleGlobalPointer, { 
        capture: false, // 不使用捕获阶段，避免干扰其他元素
        passive: true  // 使用被动监听，不阻止默认行为
      });
    });

    // 尝试监听 pointerrawupdate (如果浏览器支持)
    try {
      (document as any).addEventListener('pointerrawupdate', handleGlobalPointer, {
        capture: false,
        passive: true
      });
    } catch (e) {
      // 浏览器不支持，忽略
    }

    return () => {
      events.forEach(eventName => {
        (document as any).removeEventListener(eventName, handleGlobalPointer);
      });
      try {
        (document as any).removeEventListener('pointerrawupdate', handleGlobalPointer);
      } catch (e) {
        // 忽略
      }
    };
  }, [handlePointerEvent, open]);

  // Touch 事件作为额外的后备（某些设备可能需要）
  useEffect(() => {
    if (!open) return; // 弹窗关闭时不监听
    
    const handleTouch = (e: TouchEvent) => {
      // 检查是否可能是触控笔（单点触摸且有压感特征）
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // 创建模拟的 PointerEvent 来保持接口一致
        const mockPointerEvent = {
          preventDefault: () => {}, // 不实际阻止
          pointerType: 'touch',
          pressure: (touch as any).force || 0.5, // 某些设备通过 force 属性提供压感
          tiltX: 0,
          tiltY: 0,
        } as any;
        handlePointerEvent(mockPointerEvent, false); // 不阻止默认行为
      }
    };

    document.addEventListener('touchstart', handleTouch, { passive: true });
    document.addEventListener('touchmove', handleTouch, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('touchmove', handleTouch);
    };
  }, [handlePointerEvent, open]);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="✍️ 触控笔检测器"
      description="在屏幕上用手指或触控笔绘制，查看检测结果（点击右上角 X 关闭）"
      persistent={false}
      contentOptions={{
        style: {
          maxWidth: '90vw',
          maxHeight: '80vh',
        },
      }}
    >
      <div className={styles.container}>
        {/* 当前检测状态 */}
        <div className={styles.statusCard}>
          <div className={styles.statusTitle}>当前输入设备</div>
          <div className={styles.statusValue}>
            {stylusInfo ? stylusInfo.deviceType : '未检测到'}
          </div>
          <div className={styles.detectionCount}>
            检测次数: {detectionCount} | 最后事件: {lastEventType}
          </div>
          <button onClick={resetDetection} className={styles.resetButton}>
            🔄 重置检测
          </button>
        </div>

        {/* 详细信息 */}
        {stylusInfo && (
          <div className={styles.detailsCard}>
            <div className={styles.detailRow}>
              <span className={styles.label}>设备类型:</span>
              <span className={styles.value}>{stylusInfo.pointerType}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>是否为触控笔:</span>
              <span className={styles.value}>
                {stylusInfo.isStylus ? '✅ 是' : '❌ 否'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>压感值:</span>
              <span className={styles.value}>{stylusInfo.pressure.toFixed(3)}</span>
              <div className={styles.pressureBar}>
                <div 
                  className={styles.pressureFill}
                  style={{ width: `${stylusInfo.pressure * 100}%` }}
                />
              </div>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>倾斜角度 X:</span>
              <span className={styles.value}>{stylusInfo.tiltX.toFixed(1)}°</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>倾斜角度 Y:</span>
              <span className={styles.value}>{stylusInfo.tiltY.toFixed(1)}°</span>
            </div>
          </div>
        )}

        {/* 画板区域 */}
        <div className={styles.canvasArea}>
          <div className={styles.canvasLabel}>测试区域（在此处绘制）</div>
          <div 
            ref={canvasRef}
            className={styles.canvas}
            onPointerDown={(e) => {
              setIsDrawing(true);
              handlePointerEvent(e, true);
            }}
            onPointerMove={(e) => {
              if (isDrawing) {
                handlePointerEvent(e, true);
              }
            }}
            onPointerUp={(e) => {
              setIsDrawing(false);
              handlePointerEvent(e, true);
            }}
            onPointerCancel={() => setIsDrawing(false)}
          >
            {stylusInfo && isDrawing && (
              <div className={styles.activeIndicator}>
                {stylusInfo.deviceType} 检测中...
              </div>
            )}
          </div>
        </div>

        {/* 检测历史 */}
        <div className={styles.historyCard}>
          <div className={styles.historyTitle}>检测历史</div>
          <div className={styles.historyList}>
            {detectionHistory.length > 0 ? (
              detectionHistory.map((item, index) => (
                <div key={index} className={styles.historyItem}>
                  {item}
                </div>
              ))
            ) : (
              <div className={styles.emptyHistory}>暂无检测记录</div>
            )}
          </div>
        </div>

        {/* 提示信息 */}
        <div className={styles.infoCard}>
          <div className={styles.infoTitle}>💡 使用说明（已优化触控笔检测）</div>
          <ul className={styles.infoList}>
            <li>✅ 用手指触摸屏幕，会显示"手指触摸"</li>
            <li>✍️ 用 Apple Pencil / 触控笔，会显示对应设备类型</li>
            <li>📊 触控笔通常有压感（pressure &gt; 0）和倾斜角度</li>
            <li>🔍 支持: iPad Apple Pencil、小米触控笔、三星 S Pen 等</li>
            <li>⚡ 增强检测：监听多种事件，提升触控笔响应速度</li>
            <li>🐛 调试模式：查看事件类型和检测次数</li>
          </ul>
        </div>

        {/* 设备信息 */}
        <div className={styles.deviceInfo}>
          <div className={styles.deviceInfoTitle}>当前设备</div>
          <div className={styles.deviceInfoText}>
            {typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}
          </div>
        </div>
      </div>
    </Modal>
  );
};


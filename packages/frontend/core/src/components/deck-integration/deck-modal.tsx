import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Modal } from '@yunke/component';
import { toast } from '@yunke/component';

export interface DeckModalProps {
  open: boolean;
  onClose: () => void;
  onGifExport?: (gifBlob: Blob, metadata: any) => void;
}

/**
 * Decker 绘画工具集成模态框
 * 提供完整的多媒体绘画功能，支持GIF导出到白板
 */
export const DeckModal: React.FC<DeckModalProps> = ({ 
  open, 
  onClose, 
  onGifExport 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 处理来自Decker的消息
  const handleMessage = useCallback((event: MessageEvent) => {
    // 安全检查：只接受来自同源的消息
    if (event.origin !== window.location.origin) {
      return;
    }

    const { type, payload } = event.data;
    
    switch (type) {
      case 'DECK_READY':
        console.log('Decker已就绪');
        setIsReady(true);
        setIsLoading(false);
        break;
        
      case 'DECK_GIF_EXPORT':
        console.log('收到Decker GIF导出:', payload);
        try {
          const { data, filename, timestamp, size } = payload;
          
          // 将数组转换为Uint8Array再创建Blob
          const uint8Array = new Uint8Array(data);
          const gifBlob = new Blob([uint8Array], { type: 'image/gif' });
          
          // 创建元数据对象
          const metadata = {
            filename: filename || 'decker-drawing.gif',
            timestamp: timestamp || Date.now(),
            size: size || gifBlob.size,
            source: 'decker'
          };
          
          // 调用回调函数
          if (onGifExport) {
            onGifExport(gifBlob, metadata);
          }
          
          // 显示成功提示
          toast(`GIF已导出: ${metadata.filename} (${Math.round(metadata.size / 1024)}KB)`);
          
          // 自动关闭模态框
          onClose();
          
        } catch (error) {
          console.error('处理GIF导出失败:', error);
          toast('GIF导出失败，请重试');
        }
        break;
        
      case 'DECK_ERROR':
        console.error('Decker错误:', payload?.error);
        toast(`Decker错误: ${payload?.error || '未知错误'}`);
        setIsLoading(false);
        break;
    }
  }, [onGifExport, onClose]);

  // 设置消息监听器
  useEffect(() => {
    if (!open) return;

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, handleMessage]);

  // 模态框打开时重置状态
  useEffect(() => {
    if (open) {
      setIsReady(false);
      setIsLoading(true);
    }
  }, [open]);

  // 手动导出按钮点击处理
  const handleExportClick = useCallback(() => {
    if (iframeRef.current && isReady) {
      // 发送导出请求到Decker
      iframeRef.current.contentWindow?.postMessage({
        type: 'EXPORT_GIF_REQUEST'
      }, window.location.origin);
    } else {
      toast('Decker尚未就绪，请稍后再试');
    }
  }, [isReady]);

  // Decker页面URL
  const deckUrl = `/deck/index.html`;

  return (
    <Modal
      open={open}
      onOpenChange={onClose}
      width="95vw"
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '90vh',
        width: '95vw',
        maxWidth: '1200px',
        maxHeight: '800px',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* 头部工具栏 */}
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #333', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          minHeight: '56px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ 
              margin: 0, 
              color: '#fff', 
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Decker 多彩绘画工具
            </h3>
            {isLoading && (
              <div style={{ 
                color: '#888', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #333',
                  borderTop: '2px solid #666',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
                加载中...
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleExportClick} 
              disabled={!isReady}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: isReady ? '#1976d2' : '#333', 
                color: isReady ? 'white' : '#666', 
                border: 'none', 
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isReady ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (isReady) {
                  e.currentTarget.style.backgroundColor = '#1565c0';
                }
              }}
              onMouseLeave={(e) => {
                if (isReady) {
                  e.currentTarget.style.backgroundColor = '#1976d2';
                }
              }}
            >
              {isReady ? '📤 导出到白板' : '⏳ 等待就绪'}
            </button>
            
            <button
              onClick={onClose}
              style={{ 
                color: '#fff',
                padding: '8px',
                fontSize: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Decker iframe容器 */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          backgroundColor: '#000'
        }}>
          {/* 加载遮罩 */}
          {!isReady && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              zIndex: 10,
              textAlign: 'center',
              color: '#fff'
            }}>
              <div style={{
                marginBottom: '16px',
                fontSize: '18px'
              }}>
                🎨 正在加载 Decker 绘画工具...
              </div>
              <div style={{
                fontSize: '14px',
                color: '#888'
              }}>
                首次加载可能需要几秒钟
              </div>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            src={deckUrl}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              opacity: isReady ? 1 : 0.3,
              transition: 'opacity 0.3s ease-in-out'
            }}
            title="Decker 绘画工具"
            sandbox="allow-scripts allow-same-origin allow-forms"
            onLoad={() => {
              // iframe加载完成，但Decker可能还需要初始化时间
              setTimeout(() => {
                if (!isReady) {
                  setIsReady(true);
                  setIsLoading(false);
                }
              }, 2000);
            }}
          />
        </div>
        
        {/* 底部提示 */}
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid #333',
          fontSize: '12px',
          color: '#888',
          textAlign: 'center'
        }}>
          💡 在Decker中完成绘画后，点击保存按钮即可自动导出GIF到白板
        </div>
      </div>
    </Modal>
  );
};

export default DeckModal;
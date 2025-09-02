import React from 'react';
import { DeckModal, useDeckModal, insertGifToWhiteboard } from './index';

/**
 * Decker集成测试组件
 * 演示如何在白板中使用Decker绘画工具
 */
export const DeckTest: React.FC = () => {
  const { isOpen, openDeck, closeDeck, handleGifExport } = useDeckModal();

  // 处理GIF导出到白板
  const onGifExport = async (gifBlob: Blob, metadata: any) => {
    try {
      console.log('测试：收到GIF导出', { metadata });
      
      // 调用白板插入函数
      const imageUrl = await insertGifToWhiteboard(gifBlob, metadata, { x: 100, y: 100 });
      
      console.log('测试：GIF已插入白板', imageUrl);
      alert(`GIF已成功导出到白板！\n文件名: ${metadata.filename}\n大小: ${Math.round(metadata.size / 1024)}KB`);
      
    } catch (error) {
      console.error('测试：GIF导出失败', error);
      alert('GIF导出失败，请查看控制台');
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        color: '#333'
      }}>
        🎨 Decker 绘画工具集成测试
      </h2>
      
      <div style={{ 
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <p style={{ 
          fontSize: '14px', 
          color: '#666',
          lineHeight: '1.5',
          marginBottom: '16px'
        }}>
          点击下方按钮打开Decker绘画工具，完成绘画后保存即可自动导出GIF到白板
        </p>
        
        <button
          onClick={openDeck}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1565c0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1976d2';
          }}
        >
          🎨 打开 Decker 绘画工具
        </button>
      </div>
      
      <div style={{ 
        fontSize: '12px', 
        color: '#888',
        textAlign: 'center',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '12px',
        backgroundColor: 'white'
      }}>
        <strong>测试说明:</strong><br/>
        1. 点击按钮打开Decker绘画工具<br/>
        2. 在Decker中进行绘画创作<br/>
        3. 完成后点击保存或导出按钮<br/>
        4. GIF将自动导出并插入到白板中<br/>
        5. 查看浏览器控制台了解详细日志
      </div>

      <DeckModal
        open={isOpen}
        onClose={closeDeck}
        onGifExport={onGifExport}
      />
    </div>
  );
};

export default DeckTest;
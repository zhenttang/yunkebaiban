import React from 'react';

export { DeckModal } from './deck-modal';
export type { DeckModalProps } from './deck-modal';
export { DeckTest } from './deck-test';
export { DeckViewExtension } from './toolbar/decker-view';

// 工具函数：插入GIF到白板
export const insertGifToWhiteboard = async (
  gifBlob: Blob, 
  metadata: any,
  insertPoint?: { x: number; y: number }
) => {
  try {
    // 创建图片URL
    const imageUrl = URL.createObjectURL(gifBlob);
    
    // 这里需要根据实际的白板API来插入图片
    // 暂时先log，需要根据白板的具体实现来调整
    console.log('插入GIF到白板:', {
      url: imageUrl,
      metadata,
      insertPoint
    });
    
    // 释放URL对象（延迟释放，确保图片加载完成）
    setTimeout(() => {
      URL.revokeObjectURL(imageUrl);
    }, 5000);
    
    return imageUrl;
  } catch (error) {
    console.error('插入GIF到白板失败:', error);
    throw error;
  }
};

// Hook：管理Decker模态框状态

export const useDeckModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const openDeck = React.useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const closeDeck = React.useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const handleGifExport = React.useCallback(async (gifBlob: Blob, metadata: any) => {
    try {
      await insertGifToWhiteboard(gifBlob, metadata);
    } catch (error) {
      console.error('处理GIF导出失败:', error);
    }
  }, []);
  
  return {
    isOpen,
    openDeck,
    closeDeck,
    handleGifExport
  };
};
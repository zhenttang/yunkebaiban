import { createPortal } from 'react-dom';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1890ff';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        background: bgColor,
        color: '#fff',
        padding: '12px 24px',
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      {message}
    </div>,
    document.body
  );
}


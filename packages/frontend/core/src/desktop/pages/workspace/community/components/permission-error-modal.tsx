import { useState } from 'react';
import { Button } from '@affine/component';

interface PermissionErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  permission: string;
}

export const PermissionErrorModal = ({ 
  isOpen, 
  onClose, 
  docTitle, 
  permission 
}: PermissionErrorModalProps) => {
  if (!isOpen) return null;

  const getPermissionMessage = (permission: string) => {
    switch (permission) {
      case 'ADMIN':
        return '此文档仅限管理员访问';
      case 'COLLABORATOR':
        return '此文档仅限协作者及以上权限用户访问';
      case 'CUSTOM':
        return '您不在此文档的访问权限列表中';
      default:
        return '您没有权限访问此文档';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--affine-background-primary-color)',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        border: '1px solid var(--affine-border-color)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '12px'
          }}>
            🔒
          </div>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--affine-text-primary-color)'
          }}>
            无权访问文档
          </h3>
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            color: 'var(--affine-text-secondary-color)',
            fontWeight: 500
          }}>
            "{docTitle}"
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'var(--affine-background-error-color)',
          border: '1px solid var(--affine-border-error)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--affine-error-color)',
            textAlign: 'center'
          }}>
            {getPermissionMessage(permission)}
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="plain"
            onClick={onClose}
          >
            我知道了
          </Button>
        </div>
      </div>
    </div>
  );
};
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import type { CommunityDoc } from '../types';
import { formatDate } from '../utils';
import { PermissionErrorModal } from './permission-error-modal';
import * as styles from '../community.css';

interface CommunityDocCardProps {
  doc: CommunityDoc;
}

const PERMISSION_LABELS = {
  PUBLIC: '公开',
  COLLABORATOR: '协作者',
  ADMIN: '管理员',
  CUSTOM: '自定义',
} as const;

// 模拟用户权限检查函数
const checkUserPermission = (docPermission: string): boolean => {
  // 在实际应用中，这里会根据用户的实际权限来判断
  // 现在为了演示，我们假设用户对所有PUBLIC文档有权限
  console.log('🔐 检查用户权限:', { docPermission });
  
  // 模拟权限检查逻辑
  switch (docPermission) {
    case 'PUBLIC':
      return true; // 公开文档所有人都能访问
    case 'COLLABORATOR':
      return true; // 假设当前用户是协作者
    case 'ADMIN':
      return false; // 假设当前用户不是管理员
    case 'CUSTOM':
      return true; // 假设用户在自定义权限列表中
    default:
      return false;
  }
};

export const CommunityDocCard = ({ doc }: CommunityDocCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  const permissionLabel = PERMISSION_LABELS[doc.permission] || '未知';
  const hasPermission = checkUserPermission(doc.permission);

  const handleClick = () => {
    // 权限预检查
    if (!hasPermission) {
      console.log('❌ 用户无权访问此文档:', doc.id);
      setShowPermissionModal(true);
      return;
    }

    console.log('✅ 权限检查通过，跳转到详情页:', doc.id);
    navigate(`/workspace/${doc.workspaceId}/community/${doc.id}`);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <>
      <div 
        className={styles.docCard} 
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          opacity: hasPermission ? 1 : 0.6,
          cursor: hasPermission ? 'pointer' : 'not-allowed',
          transform: isHovered && hasPermission ? 'translateY(-2px)' : 'none',
          transition: 'all 0.2s ease',
          boxShadow: isHovered && hasPermission 
            ? '0 4px 12px rgba(0, 0, 0, 0.1)' 
            : '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className={styles.docCardHeader}>
          <h3 className={styles.docTitle} style={{
            color: hasPermission 
              ? 'var(--affine-text-primary-color)' 
              : 'var(--affine-text-disable-color)'
          }}>
            {doc.title}
            {!hasPermission && (
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '12px', 
                color: 'var(--affine-error-color)',
                fontWeight: 'normal'
              }}>
                🔒
              </span>
            )}
          </h3>
          <span 
            className={styles.permissionBadge}
            style={{
              backgroundColor: hasPermission 
                ? (doc.permission === 'PUBLIC' ? 'var(--affine-tag-green)' : 'var(--affine-tag-blue)')
                : 'var(--affine-text-disable-color)',
              color: 'white'
            }}
          >
            {permissionLabel}
          </span>
        </div>
        
        <div 
          className={styles.docDescription}
          style={{
            color: hasPermission 
              ? 'var(--affine-text-secondary-color)' 
              : 'var(--affine-text-disable-color)'
          }}
        >
          {doc.description || '暂无描述'}
          {!hasPermission && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '12px', 
              color: 'var(--affine-error-color)',
              fontStyle: 'italic'
            }}>
              您没有权限访问此文档
            </div>
          )}
        </div>
        
        <div className={styles.docCardFooter}>
          <div className={styles.authorInfo}>
            <span style={{
              color: hasPermission 
                ? 'var(--affine-text-secondary-color)' 
                : 'var(--affine-text-disable-color)'
            }}>
              作者: {doc.authorName}
            </span>
          </div>
          <div className={styles.docMeta}>
            <span style={{
              color: hasPermission 
                ? 'var(--affine-text-secondary-color)' 
                : 'var(--affine-text-disable-color)'
            }}>
              {formatDate(new Date(doc.sharedAt))}
            </span>
            <span style={{
              color: hasPermission 
                ? 'var(--affine-text-secondary-color)' 
                : 'var(--affine-text-disable-color)'
            }}>
              浏览 {doc.viewCount}
            </span>
          </div>
        </div>
      </div>

      <PermissionErrorModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        docTitle={doc.title}
        permission={doc.permission}
      />
    </>
  );
};
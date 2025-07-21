import { useNavigate } from 'react-router-dom';

import type { CommunityDoc } from '../types';
import { formatDate } from '../utils';
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

export const CommunityDocCard = ({ doc }: CommunityDocCardProps) => {
  const navigate = useNavigate();
  
  const permissionLabel = PERMISSION_LABELS[doc.permission] || '未知';

  const handleClick = () => {
    navigate(`/workspace/${doc.workspaceId}/community/${doc.id}`);
  };

  return (
    <div className={styles.docCard} onClick={handleClick}>
      <div className={styles.docCardHeader}>
        <h3 className={styles.docTitle}>{doc.title}</h3>
        <span className={styles.permissionBadge}>{permissionLabel}</span>
      </div>
      
      <div className={styles.docDescription}>
        {doc.description || '暂无描述'}
      </div>
      
      <div className={styles.docCardFooter}>
        <div className={styles.authorInfo}>
          <span>作者: {doc.authorName}</span>
        </div>
        <div className={styles.docMeta}>
          <span>{formatDate(new Date(doc.sharedAt))}</span>
          <span>浏览 {doc.viewCount}</span>
        </div>
      </div>
    </div>
  );
};
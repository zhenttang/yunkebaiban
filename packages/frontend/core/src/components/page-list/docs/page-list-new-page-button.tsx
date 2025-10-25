import { Button } from '@yunke/component';
import type { MouseEvent, ReactNode } from 'react';

// 🔥 Bug修复：实现新建页面按钮功能
// GraphQL已移除，但页面创建功能通过REST API实现

export type PageListNewPageButtonProps = {
  size?: 'small' | 'default';
  className?: string;
  children?: ReactNode;
  onCreateEdgeless?: (event: MouseEvent<HTMLDivElement | HTMLButtonElement>) => void;
  onCreatePage?: (event: MouseEvent<HTMLDivElement | HTMLButtonElement>) => void;
  onCreateDoc?: (event: MouseEvent<HTMLDivElement | HTMLButtonElement>) => void;
  onImportFile?: () => void;
  'data-testid'?: string;
};

export const PageListNewPageButton = ({
  size = 'default',
  className,
  children,
  onCreateDoc,
  'data-testid': testId,
}: PageListNewPageButtonProps) => {
  // 默认行为：创建普通文档
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (onCreateDoc) {
      onCreateDoc(event);
    }
  };

  return (
    <Button
      size={size}
      className={className}
      onClick={handleClick}
      data-testid={testId}
    >
      {children}
    </Button>
  );
};

export default PageListNewPageButton;

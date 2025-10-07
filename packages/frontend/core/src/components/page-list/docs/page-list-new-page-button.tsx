import type { MouseEvent } from 'react';

// Placeholder component for page list new page button
// This file is a temporary stub since GraphQL functionality has been removed

export type PageListNewPageButtonProps = {
  size?: 'small' | 'default';
  className?: string;
  children?: React.ReactNode;
  onCreateEdgeless?: (event: MouseEvent<HTMLDivElement | HTMLButtonElement>) => void;
  onCreatePage?: (event: MouseEvent<HTMLDivElement | HTMLButtonElement>) => void;
  onCreateDoc?: (event: MouseEvent<HTMLDivElement | HTMLButtonElement>) => void;
  onImportFile?: () => void;
  'data-testid'?: string;
};

export const PageListNewPageButton = (_props: PageListNewPageButtonProps) => {
  console.warn(
    'PageListNewPageButton functionality temporarily disabled - GraphQL backend removed'
  );
  return null;
};

export default PageListNewPageButton;

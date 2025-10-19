import { MenuItem, MenuSeparator, MenuSub } from '@yunke/component';
import { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import {
  ExportIcon,
  ExportToHtmlIcon,
  ExportToMarkdownIcon,
  ExportToPngIcon,
  PageIcon,
  PrinterIcon,
} from '@blocksuite/icons/rc';
import type { ReactNode } from 'react';
import { useCallback } from 'react';

import { transitionStyle } from './index.css';

interface ExportMenuItemProps<T> {
  onSelect: () => void;
  className?: string;
  type: T;
  icon: ReactNode;
  label: string;
}

interface ExportProps {
  exportHandler: (
    type: 'pdf' | 'html' | 'png' | 'markdown' | 'snapshot'
  ) => void;
  pageMode?: 'page' | 'edgeless';
  className?: string;
}

export function ExportMenuItem<T>({
  onSelect,
  className,
  type,
  icon,
  label,
}: ExportMenuItemProps<T>) {
  return (
    <MenuItem
      className={className}
      data-testid={`export-to-${type}`}
      onSelect={onSelect}
      block
      prefixIcon={icon}
    >
      {label}
    </MenuItem>
  );
}

export const PrintMenuItems = ({
  exportHandler,
  className = transitionStyle,
}: ExportProps) => {
  const t = useI18n();
  return (
    <ExportMenuItem
      onSelect={() => exportHandler('pdf')}
      className={className}
      type="pdf"
      icon={<PrinterIcon />}
      label={t['com.affine.export.print']()}
    />
  );
};

export const ExportMenuItems = ({
  exportHandler,
  className = transitionStyle,
  pageMode = 'page',
}: ExportProps) => {
  const t = useI18n();
  return (
    <>
      <ExportMenuItem
        onSelect={() => exportHandler('html')}
        className={className}
        type="html"
        icon={<ExportToHtmlIcon />}
        label={t['com.affine.export.html']()}
      />
      {pageMode !== 'edgeless' && (
        <ExportMenuItem
          onSelect={() => exportHandler('png')}
          className={className}
          type="png"
          icon={<ExportToPngIcon />}
          label={t['com.affine.export.png']()}
        />
      )}
      <ExportMenuItem
        onSelect={() => exportHandler('markdown')}
        className={className}
        type="markdown"
        icon={<ExportToMarkdownIcon />}
        label={t['com.affine.export.markdown']()}
      />
      <ExportMenuItem
        onSelect={() => exportHandler('snapshot')}
        className={className}
        type="snapshot"
        icon={<PageIcon />}
        label={t['com.affine.export.snapshot']()}
      />
    </>
  );
};

export const Export = ({ exportHandler, className, pageMode }: ExportProps) => {
  const t = useI18n();
  const items = (
    <>
      <ExportMenuItems
        exportHandler={exportHandler}
        className={className}
        pageMode={pageMode}
      />
      {pageMode !== 'edgeless' && (
        <>
          <MenuSeparator />
          <PrintMenuItems exportHandler={exportHandler} className={className} />
        </>
      )}
    </>
  );
  const handleExportMenuOpenChange = useCallback((open: boolean) => {
    if (open) {
      track.$.header.docOptions.export();
    }
  }, []);

  return (
    <MenuSub
      items={items}
      triggerOptions={{
        className: transitionStyle,
        prefixIcon: <ExportIcon />,
        'data-testid': 'export-menu',
      }}
      subOptions={{
        onOpenChange: handleExportMenuOpenChange,
      }}
    >
      {t.Export()}
    </MenuSub>
  );
};

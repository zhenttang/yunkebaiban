import {
  CloseIcon,
  ExportToHtmlIcon,
  ExportToMarkdownIcon,
  HelpIcon,
  NewIcon,
  NotionIcon,
} from '@blocksuite/icons/rc';

import { IconButton } from '../../ui/button';
import { Tooltip } from '../../ui/tooltip';
import { BlockCard } from '../card/block-card';
import {
  importPageBodyStyle,
  importPageButtonContainerStyle,
  importPageContainerStyle,
} from './index.css';

/**
 * @deprecated Not used
 */
export const ImportPage = ({
  importMarkdown,
  importHtml,
  importNotion,
  onClose,
}: {
  importMarkdown: () => void;
  importHtml: () => void;
  importNotion: () => void;
  onClose: () => void;
}) => (
  <div className={importPageContainerStyle}>
    <IconButton
      style={{
        position: 'absolute',
        right: 6,
        top: 6,
      }}
      onClick={() => {
        onClose();
      }}
    >
      <CloseIcon />
    </IconButton>
    <div className={importPageBodyStyle}>
      <div className="title">导入</div>
      <span>
        AFFiNE 将逐步支持更多文件类型的导入。&nbsp;
        <a
          href="https://community.affine.pro/c/feature-requests/import-export"
          target="_blank"
          rel="noreferrer"
        >
          提供反馈。
        </a>
      </span>
    </div>
    <div className={importPageButtonContainerStyle}>
      <BlockCard
        left={<ExportToMarkdownIcon width={20} height={20} />}
        title="Markdown文档"
        onClick={importMarkdown}
      />
      <BlockCard
        left={<ExportToHtmlIcon width={20} height={20} />}
        title="HTML文档"
        onClick={importHtml}
      />
      <BlockCard
        left={<NotionIcon width={20} height={20} />}
        title="Notion页面"
        right={
          <Tooltip
            content={'了解如何将 Notion 页面导入 AFFiNE。'}
          >
            <HelpIcon width={20} height={20} />
          </Tooltip>
        }
        onClick={importNotion}
      />
      <BlockCard
        left={<NewIcon width={20} height={20} />}
        title="即将推出..."
        disabled
        onClick={importHtml}
      />
    </div>
  </div>
);

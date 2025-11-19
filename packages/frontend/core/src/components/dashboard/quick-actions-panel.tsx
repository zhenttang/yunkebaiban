import { PlusIcon, UploadIcon } from '@blocksuite/icons/rc';

import { QuickActionCard } from './quick-action-card';
import * as styles from './quick-actions.css';

export const QuickActionsPanel = () => {
  // 当前 Demo 仅展示静态布局，后续可接入真实创建 / 导入逻辑
  return (
    <section className={styles.panel} aria-label="快速开始">
      <div className={styles.grid}>
        <QuickActionCard
          tone="indigo"
          icon={<PlusIcon style={{ width: 20, height: 20 }} />}
          title="创建空白文档"
          description="从一张干净的画布开始，快速记录你的想法。"
          hint="立即创建"
        />
        <QuickActionCard
          tone="emerald"
          icon={<UploadIcon style={{ width: 20, height: 20 }} />}
          title="导入外部文件"
          description="支持 Markdown、Word、PDF 等多种格式的无损导入。"
          hint="选择文件"
        />
      </div>
    </section>
  );
};


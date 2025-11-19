import { Button } from '@yunke/component';

import { EmptyHero } from './empty-hero';
import { QuickActionsPanel } from './quick-actions-panel';

export const WorkspaceDashboardMain = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', rowGap: 24 }}>
      {/* 顶部标题和占位操作区 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            文档
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#6b7280',
              marginTop: 4,
            }}
          >
            用卡片和空状态来预览未来的文档管理首页布局。
          </div>
        </div>
        <Button variant="primary">新建文档</Button>
      </header>

      {/* 快速操作区 */}
      <QuickActionsPanel />

      {/* 空状态区 */}
      <EmptyHero
        title="开启你的创作之旅"
        description="这里暂时还没有任何页面。你可以从上方卡片快速开始，或者使用快捷键 N 创建一个新文档。"
        actions={null}
      />
    </div>
  );
};


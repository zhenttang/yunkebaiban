import type { ReactNode } from 'react';
import { AddCollectionIcon, AllDocsIcon, HomeIcon, SearchIcon } from '@blocksuite/icons/rc';

import * as glassStyles from './glass.css';

export interface WorkspaceSidebarDashboardLayoutProps {
  workspaceCard?: ReactNode;
  searchRow?: ReactNode;
  dashboardSection?: ReactNode;
  collectionsSection?: ReactNode;
}

export const WorkspaceSidebarDashboardLayout = ({
  workspaceCard,
  searchRow,
  dashboardSection,
  collectionsSection,
}: WorkspaceSidebarDashboardLayoutProps) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Workspace card */}
      <div style={{ padding: '20px 20px 12px' }}>{workspaceCard}</div>

      {/* Search */}
      <div style={{ padding: '0 20px 8px' }}>{searchRow}</div>

      {/* Navigation */}
      <nav
        style={{
          padding: '8px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          rowGap: 20,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {dashboardSection}
        {collectionsSection}
      </nav>
    </div>
  );
};

export const WorkspaceSidebarDashboard = () => {
  // 保持原有 demo 行为，使用 Layout 填入静态内容
  const workspaceCard = (
    <div
      className={glassStyles.glassCard}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 12,
        borderRadius: 18,
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', marginRight: 12 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            background:
              'linear-gradient(135deg, #4f46e5, #a855f7, #06b6d4)',
            opacity: 0.9,
            transform: 'rotate(4deg)',
          }}
        />
        <div
          style={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#4f46e5',
          }}
        >
          W
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#0f172a',
          }}
        >
          我的创意空间
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 4,
            columnGap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '999px',
              backgroundColor: '#22c55e',
            }}
          />
          <span
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.08,
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            Online
          </span>
        </div>
      </div>
    </div>
  );

  const searchRow = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 10px',
        borderRadius: 999,
        backgroundColor: 'rgba(15, 23, 42, 0.03)',
        border: '1px solid rgba(148, 163, 184, 0.4)',
      }}
    >
      <SearchIcon
        style={{
          width: 16,
          height: 16,
          color: '#9ca3af',
          marginRight: 6,
        }}
      />
      <span
        style={{
          fontSize: 12,
          color: '#94a3b8',
          flex: 1,
        }}
      >
        快速搜索
      </span>
      <span
        style={{
          fontSize: 10,
          color: '#cbd5f5',
          borderRadius: 999,
          border: '1px solid rgba(148, 163, 184, 0.6)',
          padding: '2px 6px',
        }}
      >
        ⌘ K
      </span>
    </div>
  );

  const dashboardSection = (
    <section>
      <div
        style={{
          paddingInline: 8,
          marginBottom: 8,
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.18,
          color: '#94a3b8',
        }}
      >
        Dashboard
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: 4 }}>
        <div className={glassStyles.navItemActive}>
          <HomeIcon style={{ width: 16, height: 16 }} />
          <span>概览面板</span>
        </div>
        <div className={glassStyles.navItem}>
          <AllDocsIcon style={{ width: 16, height: 16 }} />
          <span>全部文档</span>
        </div>
        <div className={glassStyles.navItem}>
          <AddCollectionIcon style={{ width: 16, height: 16 }} />
          <span>特别关注</span>
        </div>
      </div>
    </section>
  );

  const collectionsSection = (
    <section>
      <div
        style={{
          paddingInline: 8,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.18,
          color: '#94a3b8',
        }}
      >
        <span>Collections</span>
        <button
          type="button"
          style={{
            width: 20,
            height: 20,
            borderRadius: '999px',
            border: 'none',
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: 4 }}>
        <div className={glassStyles.navItem}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '999px',
              background:
                'linear-gradient(135deg, #fb7185, #ec4899)',
              boxShadow: '0 0 8px rgba(244, 114, 182, 0.55)',
            }}
          />
          <span>产品设计规范</span>
        </div>
        <div className={glassStyles.navItem}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '999px',
              background:
                'linear-gradient(135deg, #22d3ee, #3b82f6)',
              boxShadow: '0 0 8px rgba(56, 189, 248, 0.55)',
            }}
          />
          <span>Q4 营销方案</span>
        </div>
        <div className={glassStyles.navItem}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '999px',
              background:
                'linear-gradient(135deg, #fbbf24, #fb923c)',
              boxShadow: '0 0 8px rgba(251, 191, 36, 0.55)',
            }}
          />
          <span>团队建设</span>
        </div>
      </div>
    </section>
  );

  return (
    <WorkspaceSidebarDashboardLayout
      workspaceCard={workspaceCard}
      searchRow={searchRow}
      dashboardSection={dashboardSection}
      collectionsSection={collectionsSection}
    />
  );
};

# 甘特图增强功能 - 实现指南

## 🚀 快速开始

### 环境准备
```bash
# 确保项目依赖已安装
cd /mnt/d/Documents/yunkebaiban/baibanfront
npm install

# 运行开发服务器
npm run dev
```

### 项目结构概览
```
packages/frontend/core/src/blocksuite/affine/data-view/
├── view-presets/
│   ├── table/              # 现有表格视图
│   ├── kanban/             # 现有看板视图
│   └── gantt/              # 🆕 新增甘特图视图
├── property-presets/
│   ├── date/               # 现有日期属性
│   ├── date-range/         # 🆕 新增日期范围属性
│   └── task-dependency/    # 🆕 新增依赖属性
└── common/
    └── timeline/           # 🆕 新增时间轴组件
```

---

## 📋 实施步骤

### 第一阶段：基础架构搭建 (第1-2天)

#### 步骤 1.1：创建甘特图视图类型定义

<function_calls>
<invoke name="Write">
<parameter name="content">// 创建文件：packages/frontend/core/src/blocksuite/affine/data-view/view-presets/gantt/define.ts

import { viewType } from '../../view/data-view';
import type { BasicViewDataType } from '../../view/data-view';

// 甘特图视图类型定义
export const ganttViewType = viewType('gantt');

// 甘特图视图数据类型
export type GanttViewData = BasicViewDataType<'gantt', {
  // 时间轴配置
  timeline: {
    startDate: number;        // Unix 时间戳
    endDate: number;          // Unix 时间戳  
    unit: 'day' | 'week' | 'month';
    showWeekends: boolean;
    workingDays: number[];    // [1,2,3,4,5] 代表周一到周五
  };
  
  // 甘特图专用列配置
  columns: GanttViewColumn[];
  
  // 任务依赖关系
  dependencies: TaskDependency[];
  
  // 显示选项
  display: {
    showCriticalPath: boolean;
    showProgress: boolean;
    compactMode: boolean;
  };
}>;

// 甘特图列配置
export type GanttViewColumn = {
  id: string;
  type: 'task-name' | 'start-date' | 'end-date' | 'duration' | 'progress' | 'assignee';
  width?: number;
  visible: boolean;
  ganttConfig?: {
    color?: string;
    pattern?: 'solid' | 'striped' | 'dotted';
  };
};

// 任务依赖关系
export type TaskDependency = {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lag?: number; // 延迟天数
  isFlexible?: boolean;
};

// 甘特图视图数据配置
export const ganttViewDataConfig = ganttViewType.dataConfig({
  defaultData: () => ({
    timeline: {
      startDate: Date.now(),
      endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天后
      unit: 'day',
      showWeekends: true,
      workingDays: [1, 2, 3, 4, 5],
    },
    columns: [],
    dependencies: [],
    display: {
      showCriticalPath: false,
      showProgress: true,
      compactMode: false,
    },
  }),
  
  // 数据验证
  validate: (data: GanttViewData) => {
    if (data.timeline.startDate >= data.timeline.endDate) {
      throw new Error('Timeline start date must be before end date');
    }
    
    if (data.timeline.workingDays.length === 0) {
      throw new Error('At least one working day must be specified');
    }
    
    return true;
  },
});
/**
 * 图表类型配置和模板
 * 支持 10+ 种图表类型
 */

import type { ChartDataPoint, ChartDataSeries } from './data-parser.js';

// ECharts 配置类型（避免直接依赖 echarts 包）
type EChartsOption = Record<string, any>;

// 图表类型定义
export type ChartTypeId =
    | 'bar'
    | 'bar-stacked'
    | 'bar-horizontal'
    | 'line'
    | 'line-area'
    | 'pie'
    | 'pie-ring'
    | 'pie-rose'
    | 'radar'
    | 'scatter'
    | 'funnel'
    | 'gauge'
    | 'treemap'
    | 'heatmap'
    | 'sankey';

export interface ChartTypeConfig {
    id: ChartTypeId;
    name: string;
    icon: string;
    category: 'basic' | 'comparison' | 'proportion' | 'distribution' | 'flow';
    description: string;
    multiSeries: boolean;
}

// 图表类型配置
export const CHART_TYPES: ChartTypeConfig[] = [
    // 基础图表
    {
        id: 'bar',
        name: '柱状图',
        icon: '📊',
        category: 'basic',
        description: '适合对比不同类别的数据',
        multiSeries: true,
    },
    {
        id: 'bar-stacked',
        name: '堆叠柱状图',
        icon: '📊',
        category: 'comparison',
        description: '展示各部分占总体的比例',
        multiSeries: true,
    },
    {
        id: 'bar-horizontal',
        name: '条形图',
        icon: '📊',
        category: 'basic',
        description: '适合类别名称较长的数据',
        multiSeries: true,
    },
    {
        id: 'line',
        name: '折线图',
        icon: '📈',
        category: 'basic',
        description: '展示数据随时间变化的趋势',
        multiSeries: true,
    },
    {
        id: 'line-area',
        name: '面积图',
        icon: '📈',
        category: 'basic',
        description: '强调数量随时间变化的程度',
        multiSeries: true,
    },
    // 比例图表
    {
        id: 'pie',
        name: '饼图',
        icon: '🥧',
        category: 'proportion',
        description: '展示各部分占整体的比例',
        multiSeries: false,
    },
    {
        id: 'pie-ring',
        name: '环形图',
        icon: '🍩',
        category: 'proportion',
        description: '中空饼图，可显示总量',
        multiSeries: false,
    },
    {
        id: 'pie-rose',
        name: '玫瑰图',
        icon: '🌹',
        category: 'proportion',
        description: '南丁格尔玫瑰图，通过半径区分大小',
        multiSeries: false,
    },
    // 对比图表
    {
        id: 'radar',
        name: '雷达图',
        icon: '🎯',
        category: 'comparison',
        description: '多维度数据对比',
        multiSeries: true,
    },
    {
        id: 'scatter',
        name: '散点图',
        icon: '⚬',
        category: 'distribution',
        description: '展示数据分布和相关性',
        multiSeries: true,
    },
    // 流程图表
    {
        id: 'funnel',
        name: '漏斗图',
        icon: '🔻',
        category: 'flow',
        description: '展示转化率和流程各阶段',
        multiSeries: false,
    },
    {
        id: 'gauge',
        name: '仪表盘',
        icon: '🎛️',
        category: 'basic',
        description: 'KPI/进度展示',
        multiSeries: false,
    },
    {
        id: 'treemap',
        name: '树图',
        icon: '🌳',
        category: 'proportion',
        description: '层级结构数据可视化',
        multiSeries: false,
    },
    {
        id: 'heatmap',
        name: '热力图',
        icon: '🔥',
        category: 'distribution',
        description: '二维数据密度分布',
        multiSeries: false,
    },
    {
        id: 'sankey',
        name: '桑基图',
        icon: '🔀',
        category: 'flow',
        description: '流量和能量流向分析',
        multiSeries: false,
    },
];

// 按类别分组
export const getChartTypesByCategory = () => {
    const categories = {
        basic: { name: '基础图表', types: [] as ChartTypeConfig[] },
        comparison: { name: '对比图表', types: [] as ChartTypeConfig[] },
        proportion: { name: '比例图表', types: [] as ChartTypeConfig[] },
        distribution: { name: '分布图表', types: [] as ChartTypeConfig[] },
        flow: { name: '流程图表', types: [] as ChartTypeConfig[] },
    };

    CHART_TYPES.forEach(type => {
        categories[type.category].types.push(type);
    });

    return categories;
};

// 获取常用图表类型（前7个）
export const getCommonChartTypes = (): ChartTypeConfig[] => {
    return CHART_TYPES.filter(t =>
        ['bar', 'line', 'pie', 'pie-ring', 'radar', 'scatter', 'funnel'].includes(t.id)
    );
};

/**
 * 生成 ECharts 配置
 */
export const generateChartOption = (
    type: ChartTypeId,
    data: ChartDataPoint[] | ChartDataSeries[],
    title: string = ''
): EChartsOption => {
    const baseOption: EChartsOption = {
        title: title ? {
            text: title,
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold',
            },
        } : undefined,
        tooltip: {
            trigger: 'item',
        },
        animation: true,
        animationDuration: 500,
    };

    // 判断是单系列还是多系列数据
    const isSingleSeries = !Array.isArray(data[0]) && 'value' in (data[0] as ChartDataPoint);
    const singleData = isSingleSeries ? (data as ChartDataPoint[]) : undefined;
    const multiData = !isSingleSeries ? (data as ChartDataSeries[]) : undefined;

    switch (type) {
        case 'bar':
            return {
                ...baseOption,
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: multiData ? { data: multiData.map(s => s.name), bottom: 0 } : undefined,
                xAxis: {
                    type: 'category',
                    data: singleData?.map(d => d.label) || multiData?.[0]?.data.map(d => d.label) || [],
                },
                yAxis: { type: 'value' },
                series: singleData
                    ? [{
                        type: 'bar',
                        data: singleData.map(d => ({
                            value: d.value,
                            itemStyle: d.color ? { color: d.color } : undefined,
                        })),
                        barWidth: '60%',
                    }]
                    : multiData?.map(s => ({
                        name: s.name,
                        type: 'bar' as const,
                        data: s.data.map(d => d.value),
                    })),
            };

        case 'bar-stacked':
            return {
                ...baseOption,
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { data: multiData?.map(s => s.name) || [], bottom: 0 },
                xAxis: {
                    type: 'category',
                    data: singleData?.map(d => d.label) || multiData?.[0]?.data.map(d => d.label) || [],
                },
                yAxis: { type: 'value' },
                series: multiData?.map(s => ({
                    name: s.name,
                    type: 'bar' as const,
                    stack: 'total',
                    data: s.data.map(d => d.value),
                })) || [{
                    type: 'bar',
                    stack: 'total',
                    data: singleData?.map(d => d.value) || [],
                }],
            };

        case 'bar-horizontal':
            return {
                ...baseOption,
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: multiData ? { data: multiData.map(s => s.name), bottom: 0 } : undefined,
                xAxis: { type: 'value' },
                yAxis: {
                    type: 'category',
                    data: singleData?.map(d => d.label) || multiData?.[0]?.data.map(d => d.label) || [],
                },
                series: singleData
                    ? [{
                        type: 'bar',
                        data: singleData.map(d => ({
                            value: d.value,
                            itemStyle: d.color ? { color: d.color } : undefined,
                        })),
                    }]
                    : multiData?.map(s => ({
                        name: s.name,
                        type: 'bar' as const,
                        data: s.data.map(d => d.value),
                    })),
            };

        case 'line':
            return {
                ...baseOption,
                tooltip: { trigger: 'axis' },
                legend: multiData ? { data: multiData.map(s => s.name), bottom: 0 } : undefined,
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: singleData?.map(d => d.label) || multiData?.[0]?.data.map(d => d.label) || [],
                },
                yAxis: { type: 'value' },
                series: singleData
                    ? [{
                        type: 'line',
                        data: singleData.map(d => d.value),
                        smooth: true,
                    }]
                    : multiData?.map(s => ({
                        name: s.name,
                        type: 'line' as const,
                        data: s.data.map(d => d.value),
                        smooth: true,
                    })),
            };

        case 'line-area':
            return {
                ...baseOption,
                tooltip: { trigger: 'axis' },
                legend: multiData ? { data: multiData.map(s => s.name), bottom: 0 } : undefined,
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: singleData?.map(d => d.label) || multiData?.[0]?.data.map(d => d.label) || [],
                },
                yAxis: { type: 'value' },
                series: singleData
                    ? [{
                        type: 'line',
                        data: singleData.map(d => d.value),
                        smooth: true,
                        areaStyle: { opacity: 0.3 },
                    }]
                    : multiData?.map(s => ({
                        name: s.name,
                        type: 'line' as const,
                        data: s.data.map(d => d.value),
                        smooth: true,
                        areaStyle: { opacity: 0.3 },
                    })),
            };

        case 'pie':
            return {
                ...baseOption,
                legend: { bottom: 0, left: 'center' },
                series: [{
                    type: 'pie',
                    radius: '65%',
                    center: ['50%', '45%'],
                    data: singleData?.map(d => ({
                        name: d.label,
                        value: d.value,
                        itemStyle: d.color ? { color: d.color } : undefined,
                    })) || [],
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.3)',
                        },
                    },
                    label: {
                        formatter: '{b}: {d}%',
                    },
                }],
            };

        case 'pie-ring':
            return {
                ...baseOption,
                legend: { bottom: 0, left: 'center' },
                series: [{
                    type: 'pie',
                    radius: ['40%', '65%'],
                    center: ['50%', '45%'],
                    data: singleData?.map(d => ({
                        name: d.label,
                        value: d.value,
                        itemStyle: d.color ? { color: d.color } : undefined,
                    })) || [],
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.3)',
                        },
                    },
                    label: {
                        formatter: '{b}: {d}%',
                    },
                }],
            };

        case 'pie-rose':
            return {
                ...baseOption,
                legend: { bottom: 0, left: 'center' },
                series: [{
                    type: 'pie',
                    radius: ['20%', '65%'],
                    center: ['50%', '45%'],
                    roseType: 'area',
                    data: singleData?.map(d => ({
                        name: d.label,
                        value: d.value,
                        itemStyle: d.color ? { color: d.color } : undefined,
                    })) || [],
                    label: {
                        formatter: '{b}: {d}%',
                    },
                }],
            };

        case 'radar':
            const maxValue = Math.max(...(singleData?.map(d => d.value) || [100])) * 1.2;
            return {
                ...baseOption,
                legend: multiData ? { data: multiData.map(s => s.name), bottom: 0 } : undefined,
                radar: {
                    indicator: singleData?.map(d => ({
                        name: d.label,
                        max: maxValue,
                    })) || multiData?.[0]?.data.map(d => ({
                        name: d.label,
                        max: maxValue,
                    })) || [],
                    center: ['50%', '50%'],
                    radius: '65%',
                },
                series: [{
                    type: 'radar',
                    data: singleData
                        ? [{ value: singleData.map(d => d.value), name: title || '数据' }]
                        : multiData?.map(s => ({
                            value: s.data.map(d => d.value),
                            name: s.name,
                        })),
                }],
            };

        case 'scatter':
            return {
                ...baseOption,
                tooltip: {
                    trigger: 'item',
                    formatter: (params: any) => `${params.seriesName}<br/>${params.value[0]}, ${params.value[1]}`,
                },
                legend: multiData ? { data: multiData.map(s => s.name), bottom: 0 } : undefined,
                xAxis: { type: 'value', scale: true },
                yAxis: { type: 'value', scale: true },
                series: singleData
                    ? [{
                        type: 'scatter',
                        symbolSize: 12,
                        data: singleData.map((d, i) => [i, d.value]),
                    }]
                    : multiData?.map(s => ({
                        name: s.name,
                        type: 'scatter' as const,
                        symbolSize: 12,
                        data: s.data.map((d, i) => [i, d.value]),
                    })),
            };

        case 'funnel':
            return {
                ...baseOption,
                legend: { bottom: 0, left: 'center' },
                series: [{
                    type: 'funnel',
                    left: '10%',
                    top: 60,
                    bottom: 60,
                    width: '80%',
                    min: 0,
                    max: Math.max(...(singleData?.map(d => d.value) || [100])),
                    sort: 'descending',
                    gap: 2,
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: '{b}: {c}',
                    },
                    data: singleData?.map(d => ({
                        name: d.label,
                        value: d.value,
                        itemStyle: d.color ? { color: d.color } : undefined,
                    })) || [],
                }],
            };

        case 'gauge':
            const gaugeValue = singleData?.[0]?.value || 0;
            return {
                ...baseOption,
                series: [{
                    type: 'gauge',
                    progress: { show: true, width: 18 },
                    axisLine: {
                        lineStyle: { width: 18 },
                    },
                    axisTick: { show: false },
                    splitLine: { length: 15, lineStyle: { width: 2 } },
                    axisLabel: { distance: 25, fontSize: 12 },
                    anchor: {
                        show: true,
                        showAbove: true,
                        size: 25,
                        itemStyle: { borderWidth: 10 },
                    },
                    title: { show: true },
                    detail: {
                        valueAnimation: true,
                        fontSize: 28,
                        offsetCenter: [0, '70%'],
                    },
                    data: [{ value: gaugeValue, name: singleData?.[0]?.label || '完成率' }],
                }],
            };

        case 'treemap':
            return {
                ...baseOption,
                series: [{
                    type: 'treemap',
                    data: singleData?.map(d => ({
                        name: d.label,
                        value: d.value,
                        itemStyle: d.color ? { color: d.color } : undefined,
                    })) || [],
                    label: {
                        show: true,
                        formatter: '{b}: {c}',
                    },
                    breadcrumb: { show: false },
                }],
            };

        case 'heatmap':
            // 简化的热力图配置，使用数据生成网格
            const heatmapData: number[][] = [];
            singleData?.forEach((d, i) => {
                heatmapData.push([i % 7, Math.floor(i / 7), d.value]);
            });
            return {
                ...baseOption,
                tooltip: { position: 'top' },
                grid: { height: '70%', top: '10%' },
                xAxis: {
                    type: 'category',
                    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                    splitArea: { show: true },
                },
                yAxis: {
                    type: 'category',
                    data: ['早', '中', '晚'],
                    splitArea: { show: true },
                },
                visualMap: {
                    min: 0,
                    max: Math.max(...(singleData?.map(d => d.value) || [100])),
                    calculable: true,
                    orient: 'horizontal',
                    left: 'center',
                    bottom: '5%',
                },
                series: [{
                    type: 'heatmap',
                    data: heatmapData,
                    label: { show: true },
                    emphasis: {
                        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
                    },
                }],
            };

        case 'sankey':
            // 桑基图需要特殊的数据格式
            const nodes = singleData?.map(d => ({ name: d.label })) || [];
            const links = singleData?.slice(0, -1).map((d, i) => ({
                source: d.label,
                target: singleData[i + 1]?.label || '',
                value: d.value,
            })) || [];
            return {
                ...baseOption,
                series: [{
                    type: 'sankey',
                    layout: 'none',
                    emphasis: { focus: 'adjacency' },
                    data: nodes,
                    links: links,
                    label: { show: true },
                }],
            };

        default:
            return baseOption;
    }
};

/**
 * 默认数据模板
 */
export const getDefaultData = (type: ChartTypeId): ChartDataPoint[] => {
    switch (type) {
        case 'gauge':
            return [{ label: '完成率', value: 75 }];
        case 'heatmap':
            return [
                { label: '数据1', value: 10 },
                { label: '数据2', value: 20 },
                { label: '数据3', value: 30 },
                { label: '数据4', value: 40 },
                { label: '数据5', value: 50 },
                { label: '数据6', value: 60 },
                { label: '数据7', value: 70 },
            ];
        case 'sankey':
            return [
                { label: '访问', value: 1000 },
                { label: '注册', value: 600 },
                { label: '购买', value: 200 },
                { label: '复购', value: 80 },
            ];
        default:
            return [
                { label: '项目A', value: 120 },
                { label: '项目B', value: 200 },
                { label: '项目C', value: 150 },
                { label: '项目D', value: 80 },
                { label: '项目E', value: 170 },
            ];
    }
};

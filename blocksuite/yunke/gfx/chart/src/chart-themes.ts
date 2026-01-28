/**
 * ECharts 主题配置
 * 提供 6 种专业配色主题
 */

export type ThemeId = 'default' | 'business' | 'tech' | 'fresh' | 'dark' | 'gradient';

export interface ChartTheme {
    id: ThemeId;
    name: string;
    colors: string[];
    backgroundColor: string;
    textColor: string;
    axisColor: string;
    splitLineColor: string;
    tooltipBackground: string;
    tooltipTextColor: string;
}

// 默认主题 - 经典专业配色
export const defaultTheme: ChartTheme = {
    id: 'default',
    name: '默认',
    colors: [
        '#5470c6', '#91cc75', '#fac858', '#ee6666',
        '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
        '#ea7ccc', '#48b8d0'
    ],
    backgroundColor: 'transparent',
    textColor: '#333333',
    axisColor: '#333333',
    splitLineColor: '#e0e0e0',
    tooltipBackground: 'rgba(50, 50, 50, 0.9)',
    tooltipTextColor: '#ffffff',
};

// 商务主题 - 稳重专业
export const businessTheme: ChartTheme = {
    id: 'business',
    name: '商务',
    colors: [
        '#2c3e50', '#3498db', '#1abc9c', '#9b59b6',
        '#e74c3c', '#f39c12', '#27ae60', '#8e44ad',
        '#16a085', '#c0392b'
    ],
    backgroundColor: 'transparent',
    textColor: '#2c3e50',
    axisColor: '#34495e',
    splitLineColor: '#bdc3c7',
    tooltipBackground: 'rgba(44, 62, 80, 0.95)',
    tooltipTextColor: '#ecf0f1',
};

// 科技主题 - 现代数字感
export const techTheme: ChartTheme = {
    id: 'tech',
    name: '科技',
    colors: [
        '#00d4ff', '#00ff88', '#ff6b6b', '#ffd93d',
        '#6c5ce7', '#a29bfe', '#fd79a8', '#00cec9',
        '#74b9ff', '#ff7675'
    ],
    backgroundColor: 'transparent',
    textColor: '#2d3436',
    axisColor: '#636e72',
    splitLineColor: '#dfe6e9',
    tooltipBackground: 'rgba(45, 52, 54, 0.95)',
    tooltipTextColor: '#00d4ff',
};

// 清新主题 - 自然柔和
export const freshTheme: ChartTheme = {
    id: 'fresh',
    name: '清新',
    colors: [
        '#26de81', '#45aaf2', '#fed330', '#fc5c65',
        '#a55eea', '#2bcbba', '#fd9644', '#4b7bec',
        '#eb3b5a', '#20bf6b'
    ],
    backgroundColor: 'transparent',
    textColor: '#4a5568',
    axisColor: '#718096',
    splitLineColor: '#e2e8f0',
    tooltipBackground: 'rgba(74, 85, 104, 0.95)',
    tooltipTextColor: '#ffffff',
};

// 暗黑主题 - 深色背景
export const darkTheme: ChartTheme = {
    id: 'dark',
    name: '暗黑',
    colors: [
        '#5470c6', '#91cc75', '#fac858', '#ee6666',
        '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
        '#ea7ccc', '#48b8d0'
    ],
    backgroundColor: '#1a1a2e',
    textColor: '#e0e0e0',
    axisColor: '#888888',
    splitLineColor: '#333355',
    tooltipBackground: 'rgba(30, 30, 50, 0.95)',
    tooltipTextColor: '#e0e0e0',
};

// 渐变主题 - 现代渐变风格
export const gradientTheme: ChartTheme = {
    id: 'gradient',
    name: '渐变',
    colors: [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140'
    ],
    backgroundColor: 'transparent',
    textColor: '#4a5568',
    axisColor: '#718096',
    splitLineColor: '#e2e8f0',
    tooltipBackground: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))',
    tooltipTextColor: '#ffffff',
};

// 主题映射表
export const CHART_THEMES: Record<ThemeId, ChartTheme> = {
    default: defaultTheme,
    business: businessTheme,
    tech: techTheme,
    fresh: freshTheme,
    dark: darkTheme,
    gradient: gradientTheme,
};

// 获取主题列表
export const getThemeList = (): ChartTheme[] => Object.values(CHART_THEMES);

// 根据 ID 获取主题
export const getThemeById = (id: ThemeId): ChartTheme => CHART_THEMES[id] || defaultTheme;

/**
 * 将主题转换为 ECharts 配置
 */
export const themeToEChartsOption = (theme: ChartTheme) => ({
    color: theme.colors,
    backgroundColor: theme.backgroundColor,
    textStyle: {
        color: theme.textColor,
    },
    title: {
        textStyle: {
            color: theme.textColor,
        },
    },
    legend: {
        textStyle: {
            color: theme.textColor,
        },
    },
    tooltip: {
        backgroundColor: theme.tooltipBackground,
        textStyle: {
            color: theme.tooltipTextColor,
        },
        borderWidth: 0,
    },
    xAxis: {
        axisLine: {
            lineStyle: {
                color: theme.axisColor,
            },
        },
        axisTick: {
            lineStyle: {
                color: theme.axisColor,
            },
        },
        axisLabel: {
            color: theme.textColor,
        },
        splitLine: {
            lineStyle: {
                color: theme.splitLineColor,
            },
        },
    },
    yAxis: {
        axisLine: {
            lineStyle: {
                color: theme.axisColor,
            },
        },
        axisTick: {
            lineStyle: {
                color: theme.axisColor,
            },
        },
        axisLabel: {
            color: theme.textColor,
        },
        splitLine: {
            lineStyle: {
                color: theme.splitLineColor,
            },
        },
    },
    radar: {
        axisLine: {
            lineStyle: {
                color: theme.splitLineColor,
            },
        },
        splitLine: {
            lineStyle: {
                color: theme.splitLineColor,
            },
        },
        splitArea: {
            areaStyle: {
                color: ['transparent', 'transparent'],
            },
        },
        name: {
            textStyle: {
                color: theme.textColor,
            },
        },
    },
});

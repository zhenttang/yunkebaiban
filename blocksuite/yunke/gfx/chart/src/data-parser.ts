/**
 * 数据解析器
 * 支持表格粘贴、JSON 导入等多种数据输入方式
 */

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface ChartDataSeries {
    name: string;
    data: ChartDataPoint[];
}

/**
 * 解析从 Excel/Google Sheets 粘贴的表格数据
 * 支持格式：
 * - 两列数据：标签 | 数值
 * - 多列数据：标签 | 系列1 | 系列2 | ...
 */
export const parseTableData = (text: string): ChartDataPoint[] | ChartDataSeries[] | null => {
    if (!text.trim()) return null;

    // 分割行
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return null;

    // 分割列（支持 Tab 和逗号分隔）
    const rows = lines.map(line =>
        line.split(/\t|,/).map(cell => cell.trim())
    );

    // 检测是否有表头
    const firstRow = rows[0];
    const hasHeader = firstRow.length > 1 && isNaN(parseFloat(firstRow[1]));

    // 两列数据：简单的标签-数值对
    if (rows[0].length === 2) {
        const startIndex = hasHeader ? 1 : 0;
        return rows.slice(startIndex).map(row => ({
            label: row[0] || '',
            value: parseFloat(row[1]) || 0,
        }));
    }

    // 多列数据：多系列
    if (rows[0].length > 2) {
        const startIndex = hasHeader ? 1 : 0;
        const seriesNames = hasHeader
            ? firstRow.slice(1)
            : firstRow.slice(1).map((_, i) => `系列${i + 1}`);

        const series: ChartDataSeries[] = seriesNames.map((name, i) => ({
            name,
            data: rows.slice(startIndex).map(row => ({
                label: row[0] || '',
                value: parseFloat(row[i + 1]) || 0,
            })),
        }));

        return series;
    }

    return null;
};

/**
 * 解析 JSON 格式数据
 * 支持多种格式：
 * - 数组格式：[{label, value}, ...]
 * - 对象格式：{labels: [], values: []}
 * - 系列格式：[{name, data: [{label, value}]}, ...]
 */
export const parseJSONData = (jsonStr: string): ChartDataPoint[] | ChartDataSeries[] | null => {
    try {
        const data = JSON.parse(jsonStr);

        // 数组格式
        if (Array.isArray(data)) {
            // 检查是否为系列数据
            if (data[0]?.name && Array.isArray(data[0]?.data)) {
                return data as ChartDataSeries[];
            }

            // 简单数组格式
            if (data[0]?.label !== undefined && data[0]?.value !== undefined) {
                return data.map(item => ({
                    label: String(item.label || ''),
                    value: Number(item.value) || 0,
                    color: item.color,
                }));
            }

            // 纯数值数组
            if (typeof data[0] === 'number') {
                return data.map((value, index) => ({
                    label: `项目${index + 1}`,
                    value: Number(value) || 0,
                }));
            }
        }

        // 对象格式 {labels: [], values: []}
        if (data.labels && data.values && Array.isArray(data.labels) && Array.isArray(data.values)) {
            return data.labels.map((label: string, index: number) => ({
                label: String(label),
                value: Number(data.values[index]) || 0,
                color: data.colors?.[index],
            }));
        }

        // 对象格式 {series: [...]}
        if (data.series && Array.isArray(data.series)) {
            return data.series as ChartDataSeries[];
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * 验证数据格式
 */
export const validateData = (data: ChartDataPoint[] | ChartDataSeries[] | null): boolean => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return false;
    }

    // 检查单系列数据
    if ('label' in data[0]) {
        return data.every((item: any) =>
            typeof item.label === 'string' &&
            typeof item.value === 'number' &&
            !isNaN(item.value)
        );
    }

    // 检查多系列数据
    if ('name' in data[0] && 'data' in data[0]) {
        return data.every((series: any) =>
            typeof series.name === 'string' &&
            Array.isArray(series.data) &&
            series.data.every((item: any) =>
                typeof item.label === 'string' &&
                typeof item.value === 'number' &&
                !isNaN(item.value)
            )
        );
    }

    return false;
};

/**
 * 检测粘贴内容类型
 */
export const detectDataFormat = (text: string): 'table' | 'json' | 'unknown' => {
    const trimmed = text.trim();

    // JSON 格式检测
    if (
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
        try {
            JSON.parse(trimmed);
            return 'json';
        } catch {
            // 不是有效 JSON
        }
    }

    // 表格格式检测（包含 Tab 或多行）
    if (trimmed.includes('\t') || trimmed.includes('\n')) {
        return 'table';
    }

    return 'unknown';
};

/**
 * 智能解析数据
 */
export const parseData = (text: string): {
    data: ChartDataPoint[] | ChartDataSeries[] | null;
    format: 'table' | 'json' | 'unknown';
    error?: string;
} => {
    const format = detectDataFormat(text);

    let data: ChartDataPoint[] | ChartDataSeries[] | null = null;
    let error: string | undefined;

    switch (format) {
        case 'json':
            data = parseJSONData(text);
            if (!data) {
                error = 'JSON 格式无效或数据结构不支持';
            }
            break;
        case 'table':
            data = parseTableData(text);
            if (!data) {
                error = '表格格式无效，请确保数据至少有两行两列';
            }
            break;
        default:
            error = '无法识别数据格式，请使用表格或 JSON 格式';
    }

    if (data && !validateData(data)) {
        return { data: null, format, error: '数据验证失败，请检查数据格式' };
    }

    return { data, format, error };
};

/**
 * 将数据导出为 JSON 字符串
 */
export const exportToJSON = (data: ChartDataPoint[] | ChartDataSeries[]): string => {
    return JSON.stringify(data, null, 2);
};

/**
 * 将数据导出为 CSV 字符串
 */
export const exportToCSV = (data: ChartDataPoint[] | ChartDataSeries[]): string => {
    // 单系列数据
    if ('label' in data[0]) {
        const singleData = data as ChartDataPoint[];
        const header = '标签,数值';
        const rows = singleData.map(d => `${d.label},${d.value}`);
        return [header, ...rows].join('\n');
    }

    // 多系列数据
    const multiData = data as ChartDataSeries[];
    const labels = multiData[0].data.map(d => d.label);
    const header = ['标签', ...multiData.map(s => s.name)].join(',');
    const rows = labels.map((label, i) => {
        const values = multiData.map(s => s.data[i].value);
        return [label, ...values].join(',');
    });

    return [header, ...rows].join('\n');
};

/**
 * 生成示例数据
 */
export const generateSampleData = (type: 'simple' | 'multi' | 'time'): ChartDataPoint[] | ChartDataSeries[] => {
    switch (type) {
        case 'simple':
            return [
                { label: '产品A', value: 120 },
                { label: '产品B', value: 200 },
                { label: '产品C', value: 150 },
                { label: '产品D', value: 80 },
                { label: '产品E', value: 170 },
            ];
        case 'multi':
            return [
                {
                    name: '2024年',
                    data: [
                        { label: 'Q1', value: 120 },
                        { label: 'Q2', value: 200 },
                        { label: 'Q3', value: 150 },
                        { label: 'Q4', value: 180 },
                    ],
                },
                {
                    name: '2025年',
                    data: [
                        { label: 'Q1', value: 150 },
                        { label: 'Q2', value: 230 },
                        { label: 'Q3', value: 180 },
                        { label: 'Q4', value: 220 },
                    ],
                },
            ];
        case 'time':
            return [
                { label: '1月', value: 100 },
                { label: '2月', value: 120 },
                { label: '3月', value: 140 },
                { label: '4月', value: 135 },
                { label: '5月', value: 160 },
                { label: '6月', value: 180 },
                { label: '7月', value: 175 },
                { label: '8月', value: 190 },
                { label: '9月', value: 200 },
                { label: '10月', value: 210 },
                { label: '11月', value: 230 },
                { label: '12月', value: 250 },
            ];
        default:
            return [];
    }
};

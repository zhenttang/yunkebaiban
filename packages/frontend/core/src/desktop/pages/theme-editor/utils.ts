/**
 * 将 CSS 变量名转换为部分数组
 * 支持 v1: --yunke-xxx (9个字符前缀)
 * 支持 v2: --yunke-v2-xxx (11个字符前缀)
 */
export const variableNameToParts = (name: string) => {
  // 检查是否是 v2 版本
  if (name.startsWith('--yunke-v2-')) {
    return name.slice(11).split('-'); // 去掉 '--yunke-v2-' (11个字符)
  }
  // v1 版本
  return name.slice(9).split('-'); // 去掉 '--yunke-' (9个字符)
};

/**
 * 将部分数组转换为 CSS 变量名
 * 注意：这个函数只生成 v1 格式，v2 格式需要在调用时指定
 */
export const partsToVariableName = (parts: string[]) =>
  `--yunke-${parts.join('-')}`;

/**
 * 将部分数组转换为 v2 格式的 CSS 变量名
 */
export const partsToVariableNameV2 = (parts: string[]) =>
  `--yunke-v2-${parts.join('-')}`;

// 根据变量名或路径判断是否是颜色变量
const isColorVariableName = (variableName: string, ancestors?: string[]): boolean => {
  const lowerName = variableName.toLowerCase();
  const fullPath = ancestors ? ancestors.join('-').toLowerCase() : lowerName;
  
  // 检查变量名和完整路径
  const searchText = `${fullPath}-${lowerName}`;
  
  return (
    searchText.includes('color') ||
    searchText.includes('background') ||
    searchText.includes('bg') ||
    searchText.includes('foreground') ||
    searchText.includes('fg') ||
    searchText.includes('border') ||
    searchText.includes('shadow') ||
    searchText.includes('overlay') ||
    searchText.includes('palette') ||
    lowerName.includes('color') ||
    lowerName.includes('background') ||
    lowerName.includes('bg') ||
    lowerName.includes('foreground') ||
    lowerName.includes('fg') ||
    lowerName.includes('border') ||
    lowerName.includes('shadow') ||
    lowerName.includes('overlay')
  );
};

export const isColor = (
  value: string | undefined,
  variableName?: string,
  ancestors?: string[]
) => {
  // 如果值存在且是颜色格式，返回 true
  if (value && (value.startsWith('#') || value.startsWith('rgb'))) {
    return true;
  }
  // 如果值不存在，但变量名或路径暗示是颜色变量，也返回 true
  if (!value && variableName && isColorVariableName(variableName, ancestors)) {
    return true;
  }
  return false;
};

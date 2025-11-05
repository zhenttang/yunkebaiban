import clsx from 'clsx';
import { type HTMLAttributes, useId } from 'react';

import * as styles from './simple-color-picker.css';

// 将颜色值转换为 hex 格式（原生 color input 只支持 hex）
const normalizeColor = (color: string): string => {
  if (!color) return '#000000';
  
  // 如果是 hex 格式，直接返回
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }
  
  // 如果是 rgb/rgba 格式，转换为 hex
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  }
  
  // 其他情况返回默认值
  return '#000000';
};

export const SimpleColorPicker = ({
  value,
  setValue,
  className,
  ...attrs
}: HTMLAttributes<HTMLDivElement> & {
  value: string;
  setValue: (value: string) => void;
}) => {
  const id = useId();
  const colorValue = normalizeColor(value);
  
  return (
    <label htmlFor={id}>
      <div
        style={{ backgroundColor: value || 'transparent' }}
        className={clsx(styles.wrapper, className)}
        {...attrs}
      >
        <input
          className={styles.input}
          type="color"
          name={id}
          id={id}
          value={colorValue}
          onChange={e => setValue(e.target.value)}
        />
      </div>
    </label>
  );
};

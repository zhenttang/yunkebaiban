import { IconButton, Input, Menu, MenuItem } from '@yunke/component';
import { MoreHorizontalIcon } from '@blocksuite/icons/rc';
import { cssVar } from '@toeverything/theme';
import { useCallback, useEffect, useState } from 'react';

import * as styles from '../theme-editor.css';
import { SimpleColorPicker } from './simple-color-picker';

export const ColorCell = ({
  value,
  custom,
  onValueChange,
}: {
  value: string;
  custom?: string;
  onValueChange?: (color?: string) => void;
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (value) {
      setInputValue(value);
    }
  }, [value]);

  const onInput = useCallback(
    (color: string) => {
      onValueChange?.(color);
      setInputValue(color);
    },
    [onValueChange]
  );

  // 直接点击颜色块也可以打开颜色选择器
  const handleColorClick = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  return (
    <div className={styles.colorCell}>
      <div>
        <div data-override={!!custom} className={styles.colorCellRow}>
          <div
            className={styles.colorCellColor}
            style={{ backgroundColor: value || 'transparent' }}
            onClick={handleColorClick}
            title="点击选择颜色"
          />
          <div className={styles.colorCellValue}>{value || '未设置'}</div>
        </div>

        <div data-empty={!custom} data-custom className={styles.colorCellRow}>
          <div
            className={styles.colorCellColor}
            style={{ backgroundColor: custom || 'transparent' }}
            onClick={handleColorClick}
            title="点击选择颜色"
          />
          <div className={styles.colorCellValue}>{custom || '未设置'}</div>
        </div>
      </div>

      <Menu
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        contentOptions={{ style: { background: cssVar('white') } }}
        items={
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SimpleColorPicker
              value={inputValue}
              setValue={onInput}
              className={styles.colorCellInput}
            />
            <Input
              value={inputValue}
              onChange={onInput}
              placeholder="输入颜色"
            />
            {custom ? (
              <MenuItem type="danger" onClick={() => onValueChange?.()}>
                恢复
              </MenuItem>
            ) : null}
          </ul>
        }
      >
        <IconButton size="14" icon={<MoreHorizontalIcon />} />
      </Menu>
    </div>
  );
};

import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

// 移动端：移除导致贴边的样式，使用 ConfirmModal 的默认 padding
export const content = BUILD_CONFIG.isMobileEdition
  ? style({
      width: '100%',
      marginLeft: '0',
      padding: '0',
    })
  : // 桌面端：保持原有逻辑以避免内容被裁剪
    style({
      width: `calc(100% + 20px)`,
      padding: '10px 10px 20px 10px',
      marginLeft: '-10px',
    });

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '12px 0px',
});
export const label = style({
  fontSize: cssVar('fontSm'),
  fontWeight: 600,
  lineHeight: '22px',
  color: cssVarV2.text.primary,
});
const baseFormInput = style({
  fontSize: 15,
  fontWeight: 500,
  lineHeight: '24px',
  color: cssVarV2.text.primary,
  border: `1px solid ${cssVarV2.layer.insideBorder.blackBorder}`,
});
export const input = style([
  baseFormInput,
  {
    borderRadius: 4,
    padding: '8px 10px',
  },
]);
export const select = style([
  baseFormInput,
  {
    borderRadius: 8,
    padding: '10px',
  },
]);

export const storageHint = style({
  marginTop: 8,
  fontSize: cssVar('fontSm'),
  lineHeight: '20px',
  color: cssVarV2.text.secondary,
});

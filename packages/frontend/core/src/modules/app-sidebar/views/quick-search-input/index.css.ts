import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';
export const root = style({
  display: 'inline-flex',
  background: cssVarV2('button/siderbarPrimary/background'),
  alignItems: 'center',
  borderRadius: '10px',
  border: '1px solid transparent',
  fontSize: cssVar('fontSm'),
  fontWeight: '500',
  width: '100%',
  height: '36px',
  minHeight: '36px',
  userSelect: 'none',
  cursor: 'pointer',
  padding: '8px 16px',
  position: 'relative',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  ':hover': {
    background: cssVarV2('layer/background/hoverOverlay'),
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
  },
  ':active': {
    transform: 'translateY(0px) scale(0.98)',
    transition: 'all 0.1s ease-out',
  },
  selectors: {
    '&:focus-within': {
      background: cssVarV2('layer/background/hoverOverlay'),
      borderColor: cssVarV2('button/primary'),
      boxShadow: '0 0 0 2px rgba(51, 102, 255, 0.12), 0 4px 12px rgba(51, 102, 255, 0.08)',
      transform: 'translateY(-1px) scale(1.01)',
    },
    '[data-theme="dark"] &:focus-within': {
      borderColor: 'rgba(99, 102, 241, 0.6)',
      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2), 0 4px 12px rgba(99, 102, 241, 0.12)',
    },
  },
});
export const icon = style({
  marginRight: '12px',
  color: cssVarV2('icon/primary'),
  fontSize: '18px',
  transition: 'transform 0.2s ease-out',
  selectors: {
    [`${root}:hover &`]: {
      transform: 'scale(1.1)',
    },
  },
});
export const spacer = style({
  flex: 1,
});
export const shortcutHint = style({
  color: cssVarV2('text/tertiary'),
  fontSize: cssVar('fontBase'),
});
export const quickSearchBarEllipsisStyle = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export const content = style({
  padding: '24px',
  flex: 1,
  overflow: 'auto',
  backgroundColor: cssVarV2('layer/background/primary'),
});

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginBottom: '24px',
  gap: '16px',
});

export const titleGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const title = style({
  fontSize: '28px',
  fontWeight: 700,
  color: cssVarV2('text/primary'),
  margin: 0,
});

export const subtitle = style({
  margin: 0,
  color: cssVarV2('text/secondary'),
  fontSize: '14px',
});

export const searchInput = style({
  width: '260px',
  padding: '10px 14px',
  borderRadius: '8px',
  border: `1px solid ${cssVarV2('layer/border')}`,
  backgroundColor: cssVarV2('layer/background/secondary'),
  color: cssVarV2('text/primary'),
  fontSize: '14px',
  outline: 'none',
  ':focus': {
    borderColor: cssVarV2('button/primary'),
    boxShadow: `0 0 0 2px ${cssVarV2('button/primary')}33`,
  },
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '16px',
});

export const empty = style({
  padding: '80px 0',
  textAlign: 'center',
  color: cssVarV2('text/tertiary'),
});

export const status = style({
  padding: '24px',
  textAlign: 'center',
  color: cssVarV2('text/secondary'),
});

export const pagination = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px',
  marginTop: '24px',
});

export const pageInfo = style({
  color: cssVarV2('text/secondary'),
  fontSize: '14px',
});

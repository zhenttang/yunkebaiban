import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: '24px',
  maxWidth: '800px',
  margin: '0 auto',
  backgroundColor: cssVarV2('layer/background/primary'),
});

export const header = style({
  textAlign: 'center',
  marginBottom: '32px',
});

export const title = style({
  fontSize: '32px',
  fontWeight: '600',
  color: cssVarV2('text/primary'),
  marginBottom: '8px',
  lineHeight: '1.2',
});

export const subtitle = style({
  fontSize: '16px',
  color: cssVarV2('text/secondary'),
  lineHeight: '1.4',
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  flex: 1,
});

export const testCard = style({
  backgroundColor: cssVarV2('layer/background/secondary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: '12px',
  padding: '24px',
  transition: 'all 0.2s ease',
  
  ':hover': {
    boxShadow: cssVarV2('shadow/popover'),
  },
});

export const instructionCard = style([testCard, {
  backgroundColor: cssVarV2('layer/background/tertiary'),
}]);

export const cardHeader = style({
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: `1px solid ${cssVarV2('layer/border')}`,
});

export const cardTitle = style({
  fontSize: '20px',
  fontWeight: '600',
  color: cssVarV2('text/primary'),
  margin: 0,
});

export const docInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '24px',
});

export const infoRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

export const label = style({
  fontSize: '14px',
  fontWeight: '500',
  color: cssVarV2('text/secondary'),
  minWidth: '80px',
});

export const value = style({
  fontSize: '14px',
  color: cssVarV2('text/primary'),
  flex: 1,
});

export const priceValue = style([value, {
  fontSize: '18px',
  fontWeight: '600',
  color: cssVarV2('button/primary'),
}]);

export const statusPending = style({
  fontSize: '14px',
  fontWeight: '500',
  color: '#faad14',
  backgroundColor: '#fff7e6',
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid #ffd591',
});

export const statusSuccess = style({
  fontSize: '14px',
  fontWeight: '500',
  color: '#52c41a',
  backgroundColor: '#f6ffed',
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid #b7eb8f',
});

export const actions = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
});

export const successMessage = style({
  fontSize: '16px',
  fontWeight: '500',
  color: '#52c41a',
  textAlign: 'center',
  padding: '12px 16px',
  backgroundColor: '#f6ffed',
  border: '1px solid #b7eb8f',
  borderRadius: '8px',
});

export const instructions = style({
  fontSize: '14px',
  lineHeight: '1.6',
});

export const instructionList = style({
  paddingLeft: '20px',
  marginBottom: '16px',
  color: cssVarV2('text/secondary'),
});

export const notice = style({
  padding: '12px 16px',
  backgroundColor: cssVarV2('layer/background/primary'),
  border: `1px solid ${cssVarV2('layer/border')}`,
  borderRadius: '8px',
  fontSize: '14px',
  color: cssVarV2('text/secondary'),
});
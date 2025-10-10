import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const page = style({
  padding: 24,
});

export const container = style({
  maxWidth: '1040px',
  margin: '0 auto',
});

export const loading = style({
  textAlign: 'center',
  padding: 40,
  color: cssVarV2('text/secondary'),
});

export const main = style({
  display: 'grid',
  gridTemplateColumns: '1fr 260px',
  gap: 20,
  alignItems: 'start',
});

export const header = style({
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  backgroundColor: cssVarV2('layer/background/secondary'),
  borderRadius: 12,
  padding: '18px 20px',
  boxShadow: cssVarV2('shadow/card'),
  gridColumn: '1 / span 1',
});

export const title = style({
  margin: 0,
  fontSize: '22px',
  fontWeight: 700,
  color: cssVarV2('text/primary'),
});

export const meta = style({
  marginTop: 8,
  color: cssVarV2('text/secondary'),
  fontSize: 13,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

export const content = style({
  marginTop: 12,
  padding: '16px 20px',
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  backgroundColor: cssVarV2('layer/background/secondary'),
  borderRadius: 12,
  boxShadow: cssVarV2('shadow/card'),
});

export const tags = style({
  marginTop: 12,
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
});

export const tag = style({
  border: `1px solid ${cssVarV2('brand/primary/softBorder')}`,
  backgroundColor: cssVarV2('brand/primary/softBackground'),
  color: cssVarV2('brand/primary/softText'),
  borderRadius: 12,
  padding: '4px 10px',
  fontSize: 12,
  cursor: 'pointer',
});

export const actionsRow = style({
  marginTop: 12,
});

export const moderatorRow = style({
  marginTop: 12,
  display: 'flex',
  gap: 8,
});

export const ghostBtn = style({
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  backgroundColor: cssVarV2('layer/background/primary'),
  color: cssVarV2('text/secondary'),
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
});

export const sidebar = style({
  position: 'sticky',
  top: 12,
  height: 'fit-content',
});

export const timelineCard = style({
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  backgroundColor: cssVarV2('layer/background/secondary'),
  borderRadius: 12,
  boxShadow: cssVarV2('shadow/card'),
});

export const timelineHeader = style({
  padding: '10px 14px',
  borderBottom: `1px solid ${cssVarV2('layer/border')}`,
  color: cssVarV2('text/primary'),
  fontWeight: 600,
});

export const timelineList = style({
  listStyle: 'none',
  margin: 0,
  padding: '10px 14px 14px',
  color: cssVarV2('text/secondary'),
  fontSize: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const replyEditor = style({
  marginTop: 16,
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  backgroundColor: cssVarV2('layer/background/secondary'),
  borderRadius: 12,
  padding: 16,
});

export const sectionTitle = style({
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
});

export const textarea = style({
  marginTop: 10,
  width: '100%',
  minHeight: 120,
  padding: 10,
  borderRadius: 8,
  border: `1px solid ${cssVarV2('layer/outline/floating')}`,
  backgroundColor: cssVarV2('layer/background/primary'),
  color: cssVarV2('text/primary'),
  outline: 'none',
});

export const primaryBtn = style({
  marginTop: 10,
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  backgroundColor: cssVarV2('brand/primary/strong'),
  color: cssVarV2('brand/primary/onStrong'),
  cursor: 'pointer',
});



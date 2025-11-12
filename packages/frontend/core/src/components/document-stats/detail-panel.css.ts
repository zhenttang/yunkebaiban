import { style } from '@vanilla-extract/css';

export const overlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '24px',
  animation: 'fadeIn 0.2s ease',

  // 移动端适配：减小内边距
  '@media': {
    'screen and (max-width: 768px)': {
      padding: '12px',
    },
  },
});

export const panel = style({
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 32px rgba(0, 0, 0, 0.2)',
  width: '100%',
  maxWidth: '520px',
  maxHeight: '65vh',
  overflow: 'auto',
  padding: '24px',
  marginBottom: '68px', // 为底部居中的状态栏留出空间
  animation: 'slideUp 0.3s ease',

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      padding: '16px',
      maxHeight: '70vh',
      marginBottom: '52px', // 移动端状态栏更小，减少边距
      borderRadius: '12px 12px 0 0',
    },
  },
});

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      marginBottom: '16px',
      paddingBottom: '12px',
    },
  },
});

export const title = style({
  fontSize: '18px',
  fontWeight: 600,
  color: '#1E1E1E',

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      fontSize: '16px',
    },
  },
});

export const closeButton = style({
  background: 'none',
  border: 'none',
  fontSize: '24px',
  color: '#8E8D91',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: '4px',
  transition: 'all 0.2s ease',

  ':hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: '#1E1E1E',
  },

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      fontSize: '22px',
      padding: '2px 6px',
    },
  },
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      gap: '16px',
    },
  },
});

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      gap: '8px',
    },
  },
});

export const groupTitle = style({
  fontSize: '14px',
  fontWeight: 600,
  color: '#1E1E1E',
  marginBottom: '4px',

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      fontSize: '13px',
      marginBottom: '2px',
    },
  },
});

export const statsList = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      gap: '8px',
    },
  },
});

export const statItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '12px',
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  borderRadius: '8px',
  border: '1px solid rgba(0, 0, 0, 0.06)',

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      padding: '10px',
      gap: '3px',
    },
  },
});

export const statLabel = style({
  fontSize: '12px',
  color: '#8E8D91',
  fontWeight: 400,

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      fontSize: '11px',
    },
  },
});

export const statValue = style({
  fontSize: '20px',
  fontWeight: 600,
  color: '#1E1E1E',

  // 移动端适配
  '@media': {
    'screen and (max-width: 768px)': {
      fontSize: '16px',
    },
  },
});

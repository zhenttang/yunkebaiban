import { cssVar } from '@toeverything/theme';
import { keyframes, style } from '@vanilla-extract/css';

// 动画定义
const slideIn = keyframes({
  '0%': {
    transform: 'translateX(100%)',
    opacity: 0,
  },
  '100%': {
    transform: 'translateX(0)',
    opacity: 1,
  },
});

const slideOut = keyframes({
  '0%': {
    transform: 'translateX(0)',
    opacity: 1,
  },
  '100%': {
    transform: 'translateX(100%)',
    opacity: 0,
  },
});

const expandWidth = keyframes({
  '0%': {
    width: '56px',
  },
  '100%': {
    width: '320px',
  },
});

const collapseWidth = keyframes({
  '0%': {
    width: '320px',
  },
  '100%': {
    width: '56px',
  },
});

// 主容器样式
export const sidebarContainer = style({
  position: 'fixed',
  top: '60px',
  right: '20px',
  height: 'calc(100vh - 80px)',
  background: `linear-gradient(135deg, ${cssVar('backgroundPrimaryColor')} 0%, rgba(255, 255, 255, 0.98) 100%)`,
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: '12px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06)',
  zIndex: 1000,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // 添加微妙的边框渐变
  '::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '12px',
    padding: '1px',
    background: `linear-gradient(135deg, ${cssVar('borderColor')} 0%, rgba(255, 255, 255, 0.3) 100%)`,
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'xor',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
  },
});

export const sidebarExpanded = style({
  width: '320px',
  animation: `${expandWidth} 0.3s cubic-bezier(0.4, 0, 0.2, 1)`,
});

export const sidebarCollapsed = style({
  width: '56px',
  animation: `${collapseWidth} 0.3s cubic-bezier(0.4, 0, 0.2, 1)`,
  
  // 折叠状态下的特殊样式
  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)`,
  
  // 添加更精致的阴影
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
  
  // 折叠时隐藏边框渐变
  '::before': {
    display: 'none',
  },
  
  // 添加一个微妙的左边框指示器
  '::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: '3px',
    background: `linear-gradient(to bottom, transparent 0%, ${cssVar('primaryColor')} 20%, ${cssVar('primaryColor')} 80%, transparent 100%)`,
    borderRadius: '0 2px 2px 0',
  },
});

export const sidebarDisabled = style({
  opacity: 0.6,
  pointerEvents: 'none',
});

// 头部样式
export const header = style({
  display: 'flex',
  alignItems: 'center',
  padding: '16px',
  borderBottom: `1px solid ${cssVar('borderColor')}`,
  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)`,
  minHeight: '56px',
  position: 'relative',
  
  '::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '16px',
    right: '16px',
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${cssVar('borderColor')} 20%, ${cssVar('borderColor')} 80%, transparent 100%)`,
  },
  
  // 折叠状态下的头部样式
  selectors: {
    [`${sidebarCollapsed} &`]: {
      padding: '12px',
      justifyContent: 'center',
      borderBottom: 'none',
      
      '::after': {
        display: 'none',
      },
    },
  },
});

export const toggleButton = style({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '8px 12px',
  borderRadius: '8px',
  color: cssVar('textPrimaryColor'),
  fontSize: '14px',
  fontWeight: '600',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  
  ':hover': {
    background: `linear-gradient(135deg, ${cssVar('hoverColor')} 0%, rgba(0, 0, 0, 0.02) 100%)`,
    transform: 'scale(1.05)',
  },
  
  ':active': {
    transform: 'scale(0.95)',
  },
  
  // 折叠状态下的按钮样式
  selectors: {
    [`${sidebarCollapsed} &`]: {
      width: '32px',
      height: '32px',
      padding: '0',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${cssVar('primaryColor')} 0%, rgba(59, 130, 246, 0.9) 100%)`,
      color: 'white',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      
      ':hover': {
        background: `linear-gradient(135deg, ${cssVar('primaryColor')} 0%, rgba(59, 130, 246, 0.95) 100%)`,
        boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
        transform: 'scale(1.1)',
      },
    },
  },
});

export const title = style({
  marginLeft: '12px',
  fontSize: '15px',
  fontWeight: '600',
  color: cssVar('textPrimaryColor'),
  userSelect: 'none',
  opacity: 0,
  transform: 'translateX(-10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  selectors: {
    [`${sidebarExpanded} &`]: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
});

// 内容区域样式
export const content = style({
  flex: 1,
  overflow: 'auto',
  padding: '12px 16px',
  
  // 自定义滚动条
  '::-webkit-scrollbar': {
    width: '6px',
  },
  '::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '::-webkit-scrollbar-thumb': {
    background: cssVar('dividerColor'),
    borderRadius: '3px',
  },
  '::-webkit-scrollbar-thumb:hover': {
    background: cssVar('iconColor'),
  },
});

// 分组样式
export const group = style({
  marginBottom: '12px',
});

export const groupHeader = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: `linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)`,
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  color: cssVar('textPrimaryColor'),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  userSelect: 'none',
  position: 'relative',
  
  ':hover': {
    background: `linear-gradient(135deg, ${cssVar('hoverColor')} 0%, rgba(59, 130, 246, 0.05) 100%)`,
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  
  ':active': {
    transform: 'translateY(0)',
  },
});

export const groupHeaderActive = style({
  background: `linear-gradient(135deg, ${cssVar('primaryColor')} 0%, rgba(59, 130, 246, 0.9) 100%)`,
  color: 'white',
  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
  
  ':hover': {
    background: `linear-gradient(135deg, ${cssVar('primaryColor')} 0%, rgba(59, 130, 246, 0.95) 100%)`,
    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
  },
});

export const groupIcon = style({
  fontSize: '16px',
  fontWeight: 'bold',
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  selectors: {
    [`${groupHeaderActive} &`]: {
      transform: 'rotate(45deg)',
    },
  },
});

// 命令列表样式
export const commands = style({
  marginTop: '8px',
  paddingLeft: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const commandItem = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  background: 'transparent',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  userSelect: 'none',
  position: 'relative',
  
  ':hover': {
    background: `linear-gradient(135deg, ${cssVar('hoverColor')} 0%, rgba(59, 130, 246, 0.03) 100%)`,
    transform: 'translateX(4px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  
  ':active': {
    transform: 'translateX(2px)',
  },
});

export const commandItemDisabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  
  ':hover': {
    background: 'transparent',
    transform: 'none',
    boxShadow: 'none',
  },
});

export const commandIcon = style({
  width: '24px',
  height: '24px',
  marginRight: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: cssVar('iconColor'),
  flexShrink: 0,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  selectors: {
    [`${commandItem}:hover &`]: {
      color: cssVar('primaryColor'),
      transform: 'scale(1.1)',
    },
  },
});

export const commandInfo = style({
  flex: 1,
  minWidth: 0,
});

export const commandName = style({
  fontSize: '14px',
  fontWeight: '500',
  color: cssVar('textPrimaryColor'),
  marginBottom: '2px',
  lineHeight: '1.3',
});

export const commandDescription = style({
  fontSize: '12px',
  color: cssVar('textSecondaryColor'),
  lineHeight: '1.4',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

// 状态指示器
export const statusIndicator = style({
  position: 'absolute',
  top: '12px',
  right: '12px',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: cssVar('successColor'),
  boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)',
  animation: `${keyframes({
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  })} 2s ease-in-out infinite`,
});

export const statusIndicatorDisabled = style({
  background: cssVar('errorColor'),
  boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
});

// 空状态样式
export const emptyState = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 16px',
  color: cssVar('textSecondaryColor'),
  fontSize: '14px',
  textAlign: 'center',
  
  '::before': {
    content: '"📝"',
    fontSize: '32px',
    marginBottom: '12px',
    opacity: 0.5,
  },
});

// 折叠状态下的功能指示器
export const collapsedIndicators = style({
  display: 'none',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  padding: '20px 0',
  
  selectors: {
    [`${sidebarCollapsed} &`]: {
      display: 'flex',
    },
  },
});

export const collapsedIndicator = style({
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)`,
  color: cssVar('iconColor'),
  fontSize: '16px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  
  ':hover': {
    background: `linear-gradient(135deg, ${cssVar('primaryColor')} 0%, rgba(59, 130, 246, 0.9) 100%)`,
    color: 'white',
    transform: 'scale(1.1)',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
});

export const collapsedIndicatorActive = style({
  background: `linear-gradient(135deg, ${cssVar('primaryColor')} 0%, rgba(59, 130, 246, 0.9) 100%)`,
  color: 'white',
  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
});
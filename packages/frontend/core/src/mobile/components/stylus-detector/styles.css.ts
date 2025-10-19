import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '16px 0',
  minHeight: 400,
});

export const statusCard = style({
  background: cssVarV2('layer/background/primary'),
  border: `2px solid ${cssVarV2('button/primary')}`,
  borderRadius: 12,
  padding: 20,
  textAlign: 'center',
});

export const statusTitle = style({
  fontSize: 14,
  color: cssVarV2('text/secondary'),
  marginBottom: 8,
});

export const statusValue = style({
  fontSize: 24,
  fontWeight: 700,
  color: cssVarV2('text/primary'),
});

export const detectionCount = style({
  fontSize: 12,
  color: cssVarV2('text/tertiary'),
  marginTop: 8,
  fontFamily: 'monospace',
});

export const resetButton = style({
  marginTop: 12,
  padding: '8px 16px',
  background: cssVarV2('button/primary'),
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  ':hover': {
    opacity: 0.9,
    transform: 'translateY(-1px)',
  },
  ':active': {
    transform: 'translateY(0)',
  },
});

export const detailsCard = style({
  background: cssVarV2('layer/background/secondary'),
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const detailRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  position: 'relative',
});

export const label = style({
  fontSize: 13,
  color: cssVarV2('text/secondary'),
  minWidth: 100,
});

export const value = style({
  fontSize: 14,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
  marginLeft: 'auto',
});

export const pressureBar = style({
  position: 'absolute',
  bottom: -6,
  left: 0,
  right: 0,
  height: 4,
  background: cssVarV2('layer/background/tertiary'),
  borderRadius: 2,
  overflow: 'hidden',
});

export const pressureFill = style({
  height: '100%',
  background: `linear-gradient(90deg, #4ade80 0%, #3b82f6 50%, #8b5cf6 100%)`,
  transition: 'width 0.1s ease-out',
});

export const canvasArea = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const canvasLabel = style({
  fontSize: 13,
  color: cssVarV2('text/secondary'),
  fontWeight: 500,
});

export const canvas = style({
  width: '100%',
  height: 200,
  background: cssVarV2('layer/background/primary'),
  border: `2px dashed ${cssVarV2('layer/insideBorder/border')}`,
  borderRadius: 12,
  cursor: 'crosshair',
  touchAction: 'none',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease-out',
  ':active': {
    borderColor: cssVarV2('button/primary'),
    background: cssVarV2('layer/background/hoverOverlay'),
    transform: 'scale(0.995)',
  },
});

export const activeIndicator = style({
  fontSize: 16,
  fontWeight: 600,
  color: cssVarV2('button/primary'),
  textAlign: 'center',
  animation: 'pulse 1s ease-in-out infinite',
  userSelect: 'none',
  pointerEvents: 'none',
});

export const historyCard = style({
  background: cssVarV2('layer/background/secondary'),
  borderRadius: 12,
  padding: 16,
  maxHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const historyTitle = style({
  fontSize: 14,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
  marginBottom: 4,
});

export const historyList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  overflowY: 'auto',
  maxHeight: 140,
});

export const historyItem = style({
  fontSize: 12,
  color: cssVarV2('text/secondary'),
  padding: '6px 8px',
  background: cssVarV2('layer/background/primary'),
  borderRadius: 6,
  fontFamily: 'monospace',
});

export const emptyHistory = style({
  fontSize: 13,
  color: cssVarV2('text/tertiary'),
  textAlign: 'center',
  padding: 20,
  fontStyle: 'italic',
});

export const infoCard = style({
  background: `linear-gradient(135deg, ${cssVarV2('layer/background/primary')} 0%, ${cssVarV2('layer/background/secondary')} 100%)`,
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
  borderRadius: 12,
  padding: 16,
});

export const infoTitle = style({
  fontSize: 14,
  fontWeight: 600,
  color: cssVarV2('text/primary'),
  marginBottom: 8,
});

export const infoList = style({
  fontSize: 13,
  color: cssVarV2('text/secondary'),
  lineHeight: 1.6,
  paddingLeft: 20,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const deviceInfo = style({
  background: cssVarV2('layer/background/tertiary'),
  borderRadius: 8,
  padding: 12,
  marginTop: 4,
});

export const deviceInfoTitle = style({
  fontSize: 12,
  fontWeight: 600,
  color: cssVarV2('text/secondary'),
  marginBottom: 6,
});

export const deviceInfoText = style({
  fontSize: 11,
  color: cssVarV2('text/tertiary'),
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  lineHeight: 1.4,
});


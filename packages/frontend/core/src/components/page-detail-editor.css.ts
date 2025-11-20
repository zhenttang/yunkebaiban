import { style } from '@vanilla-extract/css';
export const editor = style({
  flex: 1,
  selectors: {
    '&.full-screen': {
      vars: {
        '--yunke-editor-width': '100%',
        '--yunke-editor-side-padding': '72px',
      },
    },
  },
  '@media': {
    'screen and (max-width: 800px)': {
      selectors: {
        '&.is-public': {
          vars: {
            '--yunke-editor-width': '100%',
            '--yunke-editor-side-padding': '24px',
          },
        },
      },
    },
  },
});

export const editorWrapper = style({
	position: 'relative',
	width: '100%',
	display: 'flex',
	flex: 1,
	minHeight: 0,
});

export const presenceBar = style({
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 16,
  display: 'flex',
  gap: 8,
  padding: '6px 10px',
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  backdropFilter: 'blur(8px)',
  color: '#fff',
  alignItems: 'center',
});

export const presenceItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

export const presenceAvatar = style({
  width: 24,
  height: 24,
  borderRadius: 12,
  overflow: 'hidden',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 12,
  color: '#0b0f19',
});

export const presenceName = style({
  fontSize: 12,
  maxWidth: 96,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

export const cursorLayer = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 15,
});

export const cursorBadge = style({
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 12,
  border: '1px solid rgba(133,193,233,0.6)',
  color: '#0b0f19',
  fontSize: 12,
  fontWeight: 600,
  boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
  background: 'rgba(255,255,255,0.92)',
});

export const cursorDot = style({
  width: 10,
  height: 10,
  borderRadius: 5,
  display: 'inline-block',
});

export const cursorLabel = style({
  lineHeight: '14px',
});

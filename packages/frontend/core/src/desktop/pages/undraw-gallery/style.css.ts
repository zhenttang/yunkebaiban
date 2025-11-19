import { style } from '@vanilla-extract/css';

export const container = style({
  padding: '20px',
  maxWidth: '1200px',
  margin: '0 auto',
  fontFamily: 'var(--yunke-font-family)',
});

export const header = style({
  marginBottom: '30px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const title = style({
  fontSize: '24px',
  fontWeight: 'bold',
  color: 'var(--yunke-text-primary-color)',
});

export const searchContainer = style({
  width: '300px',
});

export const searchInput = style({
  width: '100%',
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '40px',
});

export const categorySection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

export const categoryTitle = style({
  fontSize: '20px',
  fontWeight: '600',
  color: 'var(--yunke-text-primary-color)',
  borderBottom: '1px solid var(--yunke-border-color)',
  paddingBottom: '10px',
});

export const subcategorySection = style({
  marginLeft: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
});

export const subcategoryTitle = style({
  fontSize: '16px',
  fontWeight: '500',
  color: 'var(--yunke-text-secondary-color)',
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '20px',
});

export const card = style({
  border: '1px solid var(--yunke-border-color)',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: 'var(--yunke-background-primary-color)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
});

export const imageContainer = style({
  padding: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '150px',
  backgroundColor: 'var(--yunke-background-secondary-color)',
});

export const image = style({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
});

export const cardFooter = style({
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  borderTop: '1px solid var(--yunke-border-color)',
});

export const fileName = style({
  fontSize: '12px',
  color: 'var(--yunke-text-primary-color)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
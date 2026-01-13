import DOMPurify from 'dompurify';

const FORUM_SANITIZE_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'img',
    'span',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'src',
    'alt',
    'title',
    'class',
    'width',
    'height',
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_ATTR: ['style', 'onerror', 'onload'],
};

const HTML_DETECTION_REGEX = /<[^>]+>/;

export function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, FORUM_SANITIZE_CONFIG);
}

export function sanitizeText(content: string): string {
  if (!content) {
    return '';
  }

  const hasHtml = HTML_DETECTION_REGEX.test(content);
  const normalized = hasHtml ? content : content.replace(/\n/g, '<br>');

  return sanitizeHtml(normalized);
}

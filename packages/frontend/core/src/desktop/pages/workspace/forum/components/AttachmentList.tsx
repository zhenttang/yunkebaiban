import type { AttachmentDTO } from '../types';

interface AttachmentListProps {
  attachments: AttachmentDTO[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div style={{ marginTop: 15 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>附件</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {attachments.map(att => {
          const ext = att.fileName?.split('.').pop()?.toLowerCase();
          const isImage =
            ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '') ||
            (att as any).contentType?.startsWith?.('image/');

          return (
            <div key={att.id} style={{ border: '1px solid #eee', borderRadius: 4, padding: 8 }}>
              {isImage ? (
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <img src={att.url} alt={att.fileName} style={{ maxWidth: 200, display: 'block' }} />
                  <div style={{ marginTop: 6, fontSize: 12, color: '#555' }}>{att.fileName}</div>
                </a>
              ) : (
                <a href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
                  {att.fileName}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


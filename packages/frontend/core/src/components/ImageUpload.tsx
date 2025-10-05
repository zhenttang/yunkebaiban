import { Button } from '@affine/component';
import { useState } from 'react';

interface ImageUploadProps {
  type?: 'avatar' | 'cover' | 'image';
  onUploadSuccess?: (url: string) => void;
  maxSizeMB?: number;
  currentImage?: string;
}

export const ImageUpload = ({
  type = 'image',
  onUploadSuccess,
  maxSizeMB = 5,
  currentImage,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('只支持图片文件');
      return;
    }

    // 验证文件大小
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`文件大小不能超过 ${maxSizeMB}MB`);
      return;
    }

    // 预览
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // 上传
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `http://172.24.48.1:8080/api/files/upload/${type}`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const data = await response.json();
      if (data.url) {
        onUploadSuccess?.(data.url);
      } else {
        throw new Error(data.message || '上传失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {preview && (
        <div style={{
          width: type === 'cover' ? '100%' : '200px',
          height: type === 'cover' ? '200px' : '200px',
          borderRadius: type === 'avatar' ? '50%' : '8px',
          overflow: 'hidden',
          border: '2px solid var(--affine-border-color)',
        }}>
          <img
            src={preview}
            alt="preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          id={`file-input-${type}`}
          style={{ display: 'none' }}
        />
        <label htmlFor={`file-input-${type}`}>
          <Button
            as="span"
            disabled={uploading}
            variant="secondary"
            size="default"
          >
            {uploading ? '上传中...' : preview ? '更换图片' : '选择图片'}
          </Button>
        </label>
      </div>

      {error && (
        <div style={{
          color: 'var(--affine-error-color)',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <div style={{
        fontSize: '12px',
        color: 'var(--affine-text-secondary-color)',
      }}>
        支持 JPG、PNG、GIF、WEBP 格式，大小不超过 {maxSizeMB}MB
      </div>
    </div>
  );
};

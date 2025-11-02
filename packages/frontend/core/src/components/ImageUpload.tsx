import { Button } from '@yunke/component';
import { useState } from 'react';
import { useService } from '@toeverything/infra';
import { FetchService } from '@yunke/core/modules/cloud';

interface ImageUploadProps {
  type?: 'avatar' | 'cover' | 'image';
  onUploadSuccess?: (url: string) => void;
  maxSizeMB?: number;
  currentImage?: string;
  fetchService?: FetchService; // 可选的FetchService，用于不在Framework上下文中的场景
}

export const ImageUpload = ({
  type = 'image',
  onUploadSuccess,
  maxSizeMB = 5,
  currentImage,
  fetchService: providedFetchService,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  
  // 优先使用传入的fetchService，否则从Framework获取
  // 注意：组件应该在Framework上下文中使用，如果不在可以通过props传入fetchService
  // hooks必须在顶层调用，所以直接调用useService
  const frameworkFetchService = useService(FetchService);
  const fetchService = providedFetchService || frameworkFetchService;

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

      // 统一使用 FetchService（如果可用），享受重试、超时、JWT token等功能
      if (fetchService) {
        const response = await fetchService.fetch(`/api/files/upload/${type}`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        const data = await response.json();
        if (data.url) {
          onUploadSuccess?.(data.url);
        } else {
          throw new Error(data.message || '上传失败');
        }
      } else {
        // 回退方案：直接使用fetch（用于不在Framework上下文中的场景）
        const { getApiBaseUrl } = await import('@yunke/config');
        const uploadUrl = `${getApiBaseUrl()}/api/files/upload/${type}`;
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        const data = await response.json();
        if (data.url) {
          onUploadSuccess?.(data.url);
        } else {
          throw new Error(data.message || '上传失败');
        }
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
          border: '2px solid var(--yunke-border-color)',
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
          color: 'var(--yunke-error-color)',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <div style={{
        fontSize: '12px',
        color: 'var(--yunke-text-secondary-color)',
      }}>
        支持 JPG、PNG、GIF、WEBP 格式，大小不超过 {maxSizeMB}MB
      </div>
    </div>
  );
};

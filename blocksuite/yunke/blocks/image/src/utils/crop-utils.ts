import type { CropArea } from '../components/image-crop-modal.js';

export interface CropOptions {
  imageSrc: string;
  crop: CropArea;
  rotation?: number;
  flip?: {
    horizontal: boolean;
    vertical: boolean;
  };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface CropResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

/**
 * 创建一个canvas并应用剪裁、旋转、翻转等操作
 */
export async function cropImage(options: CropOptions): Promise<CropResult> {
  const {
    imageSrc,
    crop,
    rotation = 0,
    flip = { horizontal: false, vertical: false },
    quality = 0.9,
    format = 'jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // 设置canvas尺寸为剪裁区域尺寸
        canvas.width = crop.width;
        canvas.height = crop.height;

        // 保存当前状态
        ctx.save();

        // 移动到canvas中心
        ctx.translate(crop.width / 2, crop.height / 2);

        // 应用旋转
        if (rotation !== 0) {
          ctx.rotate((rotation * Math.PI) / 180);
        }

        // 应用翻转
        ctx.scale(
          flip.horizontal ? -1 : 1,
          flip.vertical ? -1 : 1
        );

        // 绘制图片，从剪裁区域提取
        ctx.drawImage(
          image,
          crop.x, crop.y, crop.width, crop.height,
          -crop.width / 2, -crop.height / 2, crop.width, crop.height
        );

        // 恢复状态
        ctx.restore();

        // 转换为blob
        const mimeType = `image/${format}`;
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve({
                blob,
                url,
                width: canvas.width,
                height: canvas.height,
              });
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          mimeType,
          format === 'jpeg' ? quality : undefined
        );
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    image.src = imageSrc;
  });
}

/**
 * 获取图片的原始尺寸
 */
export function getImageDimensions(imageSrc: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    image.src = imageSrc;
  });
}

/**
 * 创建图片的缩略图
 */
export async function createThumbnail(
  imageSrc: string,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.8
): Promise<CropResult> {
  const { width, height } = await getImageDimensions(imageSrc);
  
  // 计算缩略图尺寸，保持宽高比
  let thumbnailWidth = width;
  let thumbnailHeight = height;
  
  if (width > maxWidth || height > maxHeight) {
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);
    
    thumbnailWidth = width * ratio;
    thumbnailHeight = height * ratio;
  }

  return cropImage({
    imageSrc,
    crop: { x: 0, y: 0, width, height },
    quality,
    format: 'jpeg',
  });
}

/**
 * 图片格式转换
 */
export async function convertImageFormat(
  imageSrc: string,
  targetFormat: 'jpeg' | 'png' | 'webp',
  quality: number = 0.9
): Promise<CropResult> {
  const { width, height } = await getImageDimensions(imageSrc);
  
  return cropImage({
    imageSrc,
    crop: { x: 0, y: 0, width, height },
    quality,
    format: targetFormat,
  });
}

/**
 * 计算剪裁预设比例的剪裁区域
 */
export function calculateCropArea(
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number
): CropArea {
  let cropWidth = imageWidth;
  let cropHeight = imageHeight;
  
  if (aspectRatio > 0) {
    const imageAspectRatio = imageWidth / imageHeight;
    
    if (imageAspectRatio > aspectRatio) {
      // 图片比目标比例更宽，以高度为准
      cropWidth = imageHeight * aspectRatio;
    } else {
      // 图片比目标比例更高，以宽度为准
      cropHeight = imageWidth / aspectRatio;
    }
  }
  
  const x = (imageWidth - cropWidth) / 2;
  const y = (imageHeight - cropHeight) / 2;
  
  return { x, y, width: cropWidth, height: cropHeight };
}

/**
 * 验证剪裁参数是否有效
 */
export function validateCropArea(
  crop: CropArea,
  imageWidth: number,
  imageHeight: number
): boolean {
  return (
    crop.x >= 0 &&
    crop.y >= 0 &&
    crop.width > 0 &&
    crop.height > 0 &&
    crop.x + crop.width <= imageWidth &&
    crop.y + crop.height <= imageHeight
  );
}

/**
 * 下载剪裁后的图片
 */
export function downloadCroppedImage(blob: Blob, filename: string = 'cropped-image') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 清理URL对象
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
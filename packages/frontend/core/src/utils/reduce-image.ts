import reduce from 'image-blob-reduce';

// 验证并减小图像大小，并作为文件返回
export const validateAndReduceImage = async (file: File): Promise<File> => {
  // 声明一个新的异步函数，封装解码逻辑
  const decodeAndReduceImage = async (): Promise<Blob> => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    await img.decode().catch(() => {
      URL.revokeObjectURL(url);
      throw new Error('图片无法解码');
    });

    img.onload = img.onerror = () => {
      URL.revokeObjectURL(url);
    };

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 10 || img.width > 4000 || img.height > 4000) {
      // 将文件压缩到小于10MB
      const compressedImg = await reduce().toBlob(file, {
        max: 4000,
        unsharpAmount: 80,
        unsharpRadius: 0.6,
        unsharpThreshold: 2,
      });
      return compressedImg;
    }

    return file;
  };

  try {
    const reducedBlob = await decodeAndReduceImage();

    return new File([reducedBlob], file.name, { type: file.type });
  } catch (error) {
    throw new Error('图片无法压缩：' + error);
  }
};

import QRCode from 'qrcode';

// QRCode生成工具
export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * 生成二维码图片 (Base64 DataURL)
 */
export const generateQRCode = async (
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> => {
  const { width = 200, margin = 2, color, errorCorrectionLevel = 'M' } = options;
  
  try {
    // 使用本地 qrcode 库生成 Base64 DataURL
    const dataUrl = await QRCode.toDataURL(text, {
      width,
      margin,
      color: color || {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel
    });
    
    return dataUrl;
    
  } catch (error) {
    console.error('生成二维码失败:', error);
    // 如果本地库失败，使用在线备用服务
    const backupUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${width}x${width}&margin=${margin}&data=${encodeURIComponent(text)}`;
    return backupUrl;
  }
};

/**
 * 生成二维码Canvas元素
 */
export const generateQRCodeCanvas = async (
  text: string,
  options: QRCodeOptions = {}
): Promise<HTMLCanvasElement> => {
  const { width = 200, margin = 2, color, errorCorrectionLevel = 'M' } = options;
  
  try {
    // 使用本地 qrcode 库生成 Canvas
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, text, {
      width,
      margin,
      color: color || {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel
    });
    
    return canvas;
    
  } catch (error) {
    console.error('生成二维码Canvas失败:', error);
    throw error;
  }
};

/**
 * 生成二维码SVG字符串
 */
export const generateQRCodeSVG = async (
  text: string,
  options: QRCodeOptions = {}
): Promise<string> => {
  const { width = 200, margin = 2, color, errorCorrectionLevel = 'M' } = options;
  
  try {
    // 使用本地 qrcode 库生成 SVG
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      width,
      margin,
      color: color || {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel
    });
    
    return svgString;
    
  } catch (error) {
    console.error('生成二维码SVG失败:', error);
    throw error;
  }
};

/**
 * QRCode组件React Hook
 */
export const useQRCode = () => {
  const generateImage = async (text: string, options?: QRCodeOptions) => {
    return generateQRCode(text, options);
  };
  
  const generateCanvas = async (text: string, options?: QRCodeOptions) => {
    return generateQRCodeCanvas(text, options);
  };
  
  const generateSVG = async (text: string, options?: QRCodeOptions) => {
    return generateQRCodeSVG(text, options);
  };
  
  return {
    generateImage,
    generateCanvas,
    generateSVG,
  };
};
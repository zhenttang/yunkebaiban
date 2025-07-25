// 手写箭头识别和转换系统设计

/**
 * 1. 箭头样式识别器
 */
export class HandwrittenArrowRecognizer {
  // 基于几何特征的箭头识别
  recognizeArrowStyle(strokes: Point[][]): ArrowStyleResult {
    const features = this.extractFeatures(strokes);
    return this.classifyArrowType(features);
  }

  private extractFeatures(strokes: Point[][]) {
    // 分析笔画特征
    const boundingBox = this.getBoundingBox(strokes);
    const angles = this.getStrokeAngles(strokes);
    const symmetry = this.analyzeSymmetry(strokes);
    const curvature = this.analyzeCurvature(strokes);
    
    return {
      boundingBox,
      angles,
      symmetry,
      curvature,
      strokeCount: strokes.length,
      totalLength: this.getTotalLength(strokes)
    };
  }

  private classifyArrowType(features: ArrowFeatures): ArrowStyleResult {
    // 基于特征分类箭头类型
    if (this.isTriangleArrow(features)) {
      return { type: 'Triangle', confidence: 0.9 };
    }
    if (this.isCircleArrow(features)) {
      return { type: 'Circle', confidence: 0.8 };
    }
    if (this.isDiamondArrow(features)) {
      return { type: 'Diamond', confidence: 0.85 };
    }
    if (this.isCustomArrow(features)) {
      return { 
        type: 'Custom', 
        confidence: 0.7,
        customPath: this.generateCustomPath(features)
      };
    }
    
    return { type: 'Arrow', confidence: 0.6 }; // 默认标准箭头
  }
}

/**
 * 2. 自定义箭头样式生成器
 */
export class CustomArrowStyleGenerator {
  generateFromHandwriting(strokes: Point[][]): CustomArrowStyle {
    // 从手写笔画生成自定义箭头样式
    const simplifiedPath = this.simplifyStrokes(strokes);
    const normalizedPath = this.normalizeToArrowHead(simplifiedPath);
    
    return {
      id: this.generateId(),
      name: `手写箭头_${Date.now()}`,
      path: normalizedPath,
      style: 'handwritten',
      metadata: {
        originalStrokes: strokes,
        createdAt: new Date(),
        source: 'handwriting'
      }
    };
  }

  private simplifyStrokes(strokes: Point[][]): Point[] {
    // 使用道格拉斯-普克算法简化路径
    const allPoints = strokes.flat();
    return this.douglasPeucker(allPoints, 2.0);
  }

  private normalizeToArrowHead(points: Point[]): Point[] {
    // 标准化为箭头尺寸和位置
    const bounds = this.getBounds(points);
    const center = this.getCenter(bounds);
    const scale = DEFAULT_ARROW_SIZE / Math.max(bounds.width, bounds.height);
    
    return points.map(point => ({
      x: (point.x - center.x) * scale,
      y: (point.y - center.y) * scale
    }));
  }
}

/**
 * 3. 箭头样式管理器
 */
export class ArrowStyleManager {
  private customStyles = new Map<string, CustomArrowStyle>();
  private recognizer = new HandwrittenArrowRecognizer();
  private generator = new CustomArrowStyleGenerator();

  // 从手写输入创建箭头样式
  async createFromHandwriting(strokes: Point[][]): Promise<ArrowStyleResult> {
    // 首先尝试识别为标准样式
    const recognized = this.recognizer.recognizeArrowStyle(strokes);
    
    if (recognized.confidence > 0.8 && recognized.type !== 'Custom') {
      return recognized;
    }
    
    // 如果识别不够准确，创建自定义样式
    const customStyle = this.generator.generateFromHandwriting(strokes);
    this.customStyles.set(customStyle.id, customStyle);
    
    return {
      type: 'Custom',
      customId: customStyle.id,
      confidence: 1.0
    };
  }

  // 渲染自定义箭头
  renderCustomArrow(
    customId: string,
    points: PointLocation[],
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    options: ArrowOptions
  ) {
    const style = this.customStyles.get(customId);
    if (!style) return;

    const anchorPoint = getPointWithTangent(
      points,
      options.mode,
      options.end,
      options.bezierParameters
    );

    // 应用自定义路径
    const transformedPath = this.transformPathToAnchor(style.path, anchorPoint);
    
    if (options.rough) {
      // 手写风格渲染
      rc.linearPath(transformedPath as [number, number][], {
        ...getRcOptions(options),
        roughness: 2.0,
        bowing: 2,
      });
    } else {
      // 清晰渲染
      this.renderSmoothPath(ctx, transformedPath, options);
    }
  }
}

/**
 * 4. 手写输入处理器
 */
export class HandwritingInputHandler {
  private currentStrokes: Point[][] = [];
  private isRecording = false;
  private styleManager = new ArrowStyleManager();

  startRecording() {
    this.isRecording = true;
    this.currentStrokes = [];
  }

  addPoint(point: Point) {
    if (!this.isRecording) return;
    
    if (this.currentStrokes.length === 0) {
      this.currentStrokes.push([]);
    }
    
    const currentStroke = this.currentStrokes[this.currentStrokes.length - 1];
    currentStroke.push(point);
  }

  startNewStroke() {
    if (this.isRecording) {
      this.currentStrokes.push([]);
    }
  }

  async finishRecording(): Promise<ArrowStyleResult> {
    this.isRecording = false;
    
    if (this.currentStrokes.length === 0) {
      return { type: 'Arrow', confidence: 0 };
    }

    return await this.styleManager.createFromHandwriting(this.currentStrokes);
  }
}

/**
 * 5. 几何分析工具函数
 */
export class GeometryAnalyzer {
  // 分析是否为三角形箭头
  static isTriangleArrow(features: ArrowFeatures): boolean {
    return (
      features.strokeCount >= 2 && 
      features.strokeCount <= 4 &&
      features.angles.some(angle => Math.abs(angle - Math.PI/3) < 0.3) &&
      features.symmetry > 0.7
    );
  }

  // 分析是否为圆形箭头
  static isCircleArrow(features: ArrowFeatures): boolean {
    return (
      features.strokeCount === 1 &&
      features.curvature.average > 0.8 &&
      features.curvature.variance < 0.2 &&
      this.isApproximatelyCircular(features.boundingBox)
    );
  }

  // 分析是否为菱形箭头
  static isDiamondArrow(features: ArrowFeatures): boolean {
    return (
      features.strokeCount >= 3 &&
      features.strokeCount <= 5 &&
      features.angles.filter(a => Math.abs(a - Math.PI/2) < 0.2).length >= 2 &&
      features.symmetry > 0.6
    );
  }

  // 路径简化算法（道格拉斯-普克）
  static douglasPeucker(points: Point[], epsilon: number): Point[] {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let maxIndex = 0;

    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.pointToLineDistance(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    if (maxDistance > epsilon) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
      const right = this.douglasPeucker(points.slice(maxIndex), epsilon);
      return left.slice(0, -1).concat(right);
    }

    return [start, end];
  }
}

// 类型定义
interface Point {
  x: number;
  y: number;
}

interface ArrowFeatures {
  boundingBox: { width: number; height: number; x: number; y: number };
  angles: number[];
  symmetry: number;
  curvature: { average: number; variance: number };
  strokeCount: number;
  totalLength: number;
}

interface ArrowStyleResult {
  type: PointStyle | 'Custom';
  confidence: number;
  customId?: string;
  customPath?: Point[];
}

interface CustomArrowStyle {
  id: string;
  name: string;
  path: Point[];
  style: 'handwritten' | 'smooth';
  metadata: {
    originalStrokes: Point[][];
    createdAt: Date;
    source: string;
  };
}
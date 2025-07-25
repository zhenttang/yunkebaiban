// 集成手写箭头到现有连接器系统

/**
 * 1. 扩展 PointStyle 枚举
 * 文件：/blocksuite/affine/model/src/consts/connector.ts
 */
export enum PointStyle {
  Arrow = 'Arrow',
  Circle = 'Circle',
  Diamond = 'Diamond',
  None = 'None',
  Triangle = 'Triangle',
  Custom = 'Custom',           // 新增：自定义样式
  HandwrittenInput = 'HandwrittenInput', // 新增：手写输入模式
}

/**
 * 2. 扩展连接器模型
 * 文件：/blocksuite/affine/model/src/elements/connector/connector.ts
 */
export interface ConnectorElementProps extends ElementProps {
  // ... 现有属性
  customArrowStyles?: {
    front?: string;  // 自定义前端点样式ID
    rear?: string;   // 自定义后端点样式ID
  };
  handwritingMode?: boolean; // 是否处于手写模式
}

/**
 * 3. 更新渲染器
 * 文件：/blocksuite/affine/gfx/connector/src/element-renderer/index.ts
 */
import { ArrowStyleManager } from '../../handwritten-arrow-system';

const arrowStyleManager = new ArrowStyleManager();

function renderEndpoint(
  model: ConnectorElementModel | LocalConnectorElementModel,
  location: PointLocation[],
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  end: 'Front' | 'Rear',
  style: PointStyle,
  stroke: string
) {
  const arrowOptions = getArrowOptions(end, model, stroke);

  switch (style) {
    case 'Arrow':
      renderArrow(location, ctx, rc, arrowOptions);
      break;
    case 'Triangle':
      renderTriangle(location, ctx, rc, arrowOptions);
      break;
    case 'Circle':
      renderCircle(location, ctx, rc, arrowOptions);
      break;
    case 'Diamond':
      renderDiamond(location, ctx, rc, arrowOptions);
      break;
    case 'Custom':
      // 渲染自定义箭头
      const customId = end === 'Front' 
        ? model.customArrowStyles?.front 
        : model.customArrowStyles?.rear;
      if (customId) {
        arrowStyleManager.renderCustomArrow(customId, location, ctx, rc, arrowOptions);
      } else {
        renderArrow(location, ctx, rc, arrowOptions); // 回退到默认
      }
      break;
    case 'HandwrittenInput':
      // 显示手写输入提示
      renderHandwritingInputPrompt(location, ctx, arrowOptions);
      break;
  }
}

/**
 * 4. 手写输入工具栏
 * 文件：/blocksuite/affine/gfx/connector/src/toolbar/handwriting-toolbar.ts
 */
export class HandwritingArrowToolbar {
  private inputHandler = new HandwritingInputHandler();
  private isDrawing = false;
  private currentConnector: ConnectorElementModel | null = null;
  private drawingCanvas: HTMLCanvasElement;

  constructor(private container: HTMLElement) {
    this.setupDrawingCanvas();
    this.bindEvents();
  }

  private setupDrawingCanvas() {
    this.drawingCanvas = document.createElement('canvas');
    this.drawingCanvas.style.position = 'absolute';
    this.drawingCanvas.style.pointerEvents = 'none';
    this.drawingCanvas.style.zIndex = '1000';
    this.container.appendChild(this.drawingCanvas);
  }

  startHandwritingMode(connector: ConnectorElementModel, endpoint: 'front' | 'rear') {
    this.currentConnector = connector;
    this.currentEndpoint = endpoint;
    
    // 显示手写区域
    this.showHandwritingArea();
    
    // 开始录制
    this.inputHandler.startRecording();
  }

  private async finishHandwriting() {
    const result = await this.inputHandler.finishRecording();
    
    if (result.type === 'Custom' && result.customId) {
      // 更新连接器模型
      this.updateConnectorWithCustomStyle(result.customId);
    } else {
      // 更新为识别出的标准样式
      this.updateConnectorWithStandardStyle(result.type as PointStyle);
    }
    
    this.hideHandwritingArea();
  }

  private updateConnectorWithCustomStyle(customId: string) {
    if (!this.currentConnector) return;

    const customStyles = { ...this.currentConnector.customArrowStyles };
    if (this.currentEndpoint === 'front') {
      customStyles.front = customId;
      this.currentConnector.frontEndpointStyle = PointStyle.Custom;
    } else {
      customStyles.rear = customId;
      this.currentConnector.rearEndpointStyle = PointStyle.Custom;
    }
    
    // 更新模型
    this.currentConnector.customArrowStyles = customStyles;
  }
}

/**
 * 5. 工具栏配置更新
 * 文件：/blocksuite/affine/gfx/connector/src/toolbar/config.ts
 */
const FRONT_ENDPOINT_STYLE_LIST = [
  {
    value: PointStyle.None,
    icon: StartPointIcon(),
  },
  {
    value: PointStyle.Arrow,
    icon: StartPointArrowIcon(),
  },
  {
    value: PointStyle.Triangle,
    icon: StartPointTriangleIcon(),
  },
  {
    value: PointStyle.Circle,
    icon: StartPointCircleIcon(),
  },
  {
    value: PointStyle.Diamond,
    icon: StartPointDiamondIcon(),
  },
  {
    value: PointStyle.HandwrittenInput,
    icon: HandwritingInputIcon(), // 新增手写输入图标
    action: 'startHandwriting' // 特殊动作标记
  },
] as const satisfies MenuItem<PointStyle>[];

/**
 * 6. 手写识别优化算法
 * 文件：/blocksuite/affine/gfx/connector/src/recognition/arrow-recognizer.ts
 */
export class OptimizedArrowRecognizer {
  // 快速几何特征提取
  recognizeBasicShape(strokes: Point[][]): PointStyle {
    const features = this.quickFeatureExtraction(strokes);
    
    // 基于简单规则的快速识别
    if (this.isLikelyTriangle(features)) return PointStyle.Triangle;
    if (this.isLikelyCircle(features)) return PointStyle.Circle;
    if (this.isLikelyDiamond(features)) return PointStyle.Diamond;
    
    return PointStyle.Arrow; // 默认
  }

  private quickFeatureExtraction(strokes: Point[][]) {
    const allPoints = strokes.flat();
    const boundingBox = this.getBoundingBox(allPoints);
    const aspectRatio = boundingBox.width / boundingBox.height;
    const strokeCount = strokes.length;
    const averageStrokeLength = allPoints.length / strokeCount;
    
    return {
      boundingBox,
      aspectRatio,
      strokeCount,
      averageStrokeLength,
      isClosed: this.isPathClosed(allPoints),
      hasSharpTurns: this.hasSharpTurns(allPoints)
    };
  }

  private isLikelyTriangle(features: any): boolean {
    return (
      features.strokeCount >= 2 && 
      features.strokeCount <= 4 &&
      features.hasSharpTurns &&
      Math.abs(features.aspectRatio - 1) < 0.5
    );
  }

  private isLikelyCircle(features: any): boolean {
    return (
      features.strokeCount === 1 &&
      features.isClosed &&
      !features.hasSharpTurns &&
      Math.abs(features.aspectRatio - 1) < 0.3
    );
  }

  private isLikelyDiamond(features: any): boolean {
    return (
      features.strokeCount >= 3 &&
      features.hasSharpTurns &&
      Math.abs(features.aspectRatio - 1) < 0.4
    );
  }
}

/**
 * 7. 手写UI组件
 * 文件：/blocksuite/affine/gfx/connector/src/components/handwriting-panel.ts
 */
@customElement('handwriting-arrow-panel')
export class HandwritingArrowPanel extends LitElement {
  @property({ type: Object })
  connector: ConnectorElementModel | null = null;

  @property({ type: String })
  endpoint: 'front' | 'rear' = 'rear';

  private toolbar = new HandwritingArrowToolbar(this);

  render() {
    return html`
      <div class="handwriting-panel">
        <div class="instruction">
          在下方区域手写箭头样式
        </div>
        <div class="drawing-area" @pointerdown=${this.startDrawing}>
          <canvas></canvas>
        </div>
        <div class="actions">
          <button @click=${this.clearDrawing}>清除</button>
          <button @click=${this.finishDrawing}>完成</button>
          <button @click=${this.cancel}>取消</button>
        </div>
        <div class="preview">
          <div class="preview-label">预览:</div>
          <div class="preview-arrow"></div>
        </div>
      </div>
    `;
  }

  private startDrawing(e: PointerEvent) {
    this.toolbar.startHandwritingMode(this.connector!, this.endpoint);
  }

  private async finishDrawing() {
    await this.toolbar.finishHandwriting();
    this.dispatchEvent(new CustomEvent('handwriting-complete'));
  }
}

/**
 * 8. 样式存储和管理
 * 文件：/blocksuite/affine/gfx/connector/src/storage/custom-styles.ts
 */
export class CustomArrowStyleStorage {
  private static readonly STORAGE_KEY = 'affine-custom-arrow-styles';
  
  static saveStyle(style: CustomArrowStyle): void {
    const styles = this.loadAllStyles();
    styles[style.id] = style;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(styles));
  }

  static loadStyle(id: string): CustomArrowStyle | null {
    const styles = this.loadAllStyles();
    return styles[id] || null;
  }

  static loadAllStyles(): Record<string, CustomArrowStyle> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  static deleteStyle(id: string): void {
    const styles = this.loadAllStyles();
    delete styles[id];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(styles));
  }
}
/**
 * 高级动画效果实现
 * 包含粒子效果、弹性动画、3D变换等高级视觉效果
 */

import { AnimationConfig } from '../types/animation-contracts';
import { DURATION, ANIMATION_PRESETS, QUALITY_SETTINGS } from '../types/animation-types';

/**
 * 粒子配置
 */
interface ParticleConfig {
  count: number;
  size: { min: number; max: number };
  color: string;
  speed: { min: number; max: number };
  lifetime: number;
  gravity: number;
  spread: number;
}

/**
 * 高级动画效果管理器
 */
export class AdvancedEffectsManager {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private quality: 'low' | 'medium' | 'high' = 'high';
  
  constructor(config?: Partial<AnimationConfig>) {
    this.quality = config?.quality || 'high';
    this.setupCanvas();
  }
  
  /**
   * 设置Canvas
   */
  private setupCanvas(): void {
    if (this.quality === 'low') return;
    
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
    `;
    
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  }
  
  /**
   * 调整Canvas大小
   */
  private resizeCanvas(): void {
    if (!this.canvas || !this.ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = { width: window.innerWidth, height: window.innerHeight };
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    
    this.ctx.scale(dpr, dpr);
  }
  
  /**
   * 创建布局切换粒子效果
   */
  async createLayoutTransitionEffect(
    element: HTMLElement,
    effectType: 'expand' | 'collapse' | 'transform'
  ): Promise<void> {
    if (this.quality === 'low') return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    switch (effectType) {
      case 'expand':
        await this.createExpandEffect(centerX, centerY);
        break;
      case 'collapse':
        await this.createCollapseEffect(centerX, centerY);
        break;
      case 'transform':
        await this.createTransformEffect(centerX, centerY);
        break;
    }
  }
  
  /**
   * 创建展开效果
   */
  private async createExpandEffect(x: number, y: number): Promise<void> {
    const config: ParticleConfig = {
      count: this.quality === 'high' ? 30 : 15,
      size: { min: 2, max: 6 },
      color: 'rgba(59, 130, 246, 0.8)',
      speed: { min: 50, max: 150 },
      lifetime: 1000,
      gravity: 0.2,
      spread: 360
    };
    
    this.createParticleBurst(x, y, config);
    
    // 添加波纹效果
    await this.createRippleEffect(x, y, {
      maxRadius: 100,
      duration: 600,
      color: 'rgba(59, 130, 246, 0.3)'
    });
  }
  
  /**
   * 创建收缩效果
   */
  private async createCollapseEffect(x: number, y: number): Promise<void> {
    const config: ParticleConfig = {
      count: this.quality === 'high' ? 20 : 10,
      size: { min: 1, max: 4 },
      color: 'rgba(239, 68, 68, 0.7)',
      speed: { min: 30, max: 80 },
      lifetime: 800,
      gravity: 0.5,
      spread: 180
    };
    
    this.createParticleImplosion(x, y, config);
  }
  
  /**
   * 创建变换效果
   */
  private async createTransformEffect(x: number, y: number): Promise<void> {
    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)'
    ];
    
    for (let i = 0; i < colors.length; i++) {
      setTimeout(() => {
        const config: ParticleConfig = {
          count: this.quality === 'high' ? 15 : 8,
          size: { min: 2, max: 5 },
          color: colors[i],
          speed: { min: 40, max: 100 },
          lifetime: 600,
          gravity: 0.3,
          spread: 120
        };
        this.createParticleBurst(x, y, config);
      }, i * 100);
    }
  }
  
  /**
   * 创建粒子爆炸效果
   */
  private createParticleBurst(x: number, y: number, config: ParticleConfig): void {
    if (!this.canvas || !this.ctx) return;
    
    if (!document.body.contains(this.canvas)) {
      document.body.appendChild(this.canvas);
    }
    
    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count;
      const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
      const size = config.size.min + Math.random() * (config.size.max - config.size.min);
      
      const particle = new Particle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color: config.color,
        lifetime: config.lifetime,
        gravity: config.gravity
      });
      
      this.particles.push(particle);
    }
    
    this.startParticleAnimation();
  }
  
  /**
   * 创建粒子内爆效果
   */
  private createParticleImplosion(x: number, y: number, config: ParticleConfig): void {
    if (!this.canvas || !this.ctx) return;
    
    if (!document.body.contains(this.canvas)) {
      document.body.appendChild(this.canvas);
    }
    
    for (let i = 0; i < config.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      const startX = x + Math.cos(angle) * distance;
      const startY = y + Math.sin(angle) * distance;
      
      const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
      const size = config.size.min + Math.random() * (config.size.max - config.size.min);
      
      const particle = new Particle({
        x: startX,
        y: startY,
        vx: -Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        size,
        color: config.color,
        lifetime: config.lifetime,
        gravity: -config.gravity
      });
      
      this.particles.push(particle);
    }
    
    this.startParticleAnimation();
  }
  
  /**
   * 创建波纹效果
   */
  private async createRippleEffect(
    x: number, 
    y: number, 
    options: { maxRadius: number; duration: number; color: string }
  ): Promise<void> {
    if (!this.canvas || !this.ctx) return;
    
    if (!document.body.contains(this.canvas)) {
      document.body.appendChild(this.canvas);
    }
    
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      if (!this.ctx) return;
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / options.duration, 1);
      
      if (progress < 1) {
        const radius = progress * options.maxRadius;
        const opacity = 1 - progress;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.strokeStyle = options.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
        
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * 开始粒子动画
   */
  private startParticleAnimation(): void {
    if (this.animationId !== null) return;
    
    const animate = () => {
      if (!this.ctx || !this.canvas) return;
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.particles = this.particles.filter(particle => {
        particle.update();
        particle.draw(this.ctx!);
        return particle.isAlive();
      });
      
      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.stopParticleAnimation();
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  /**
   * 停止粒子动画
   */
  private stopParticleAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.canvas && document.body.contains(this.canvas)) {
      document.body.removeChild(this.canvas);
    }
  }
  
  /**
   * 创建弹性动画
   */
  createElasticAnimation(
    element: HTMLElement,
    options: {
      scale?: number;
      duration?: number;
      elasticity?: number;
    } = {}
  ): Animation {
    const { scale = 1.1, duration = 600, elasticity = 0.8 } = options;
    
    const keyframes = [
      { 
        transform: 'scale(1)', 
        offset: 0 
      },
      { 
        transform: `scale(${scale})`, 
        offset: 0.3 
      },
      { 
        transform: `scale(${1 - (scale - 1) * 0.3})`, 
        offset: 0.6 
      },
      { 
        transform: `scale(${1 + (scale - 1) * 0.1})`, 
        offset: 0.8 
      },
      { 
        transform: 'scale(1)', 
        offset: 1 
      }
    ];
    
    return element.animate(keyframes, {
      duration,
      easing: `cubic-bezier(0.68, -${elasticity}, 0.265, 1.55)`,
      fill: 'forwards'
    });
  }
  
  /**
   * 创建3D翻转动画
   */
  create3DFlipAnimation(
    element: HTMLElement,
    axis: 'x' | 'y' = 'y',
    angle: number = 180
  ): Animation {
    element.style.transformStyle = 'preserve-3d';
    
    const keyframes = [
      { 
        transform: `perspective(1000px) rotate${axis.toUpperCase()}(0deg)`,
        offset: 0 
      },
      { 
        transform: `perspective(1000px) rotate${axis.toUpperCase()}(${angle/2}deg)`,
        offset: 0.5 
      },
      { 
        transform: `perspective(1000px) rotate${axis.toUpperCase()}(${angle}deg)`,
        offset: 1 
      }
    ];
    
    return element.animate(keyframes, {
      duration: DURATION.slow,
      easing: ANIMATION_PRESETS.normal.easing,
      fill: 'forwards'
    });
  }
  
  /**
   * 创建磁性吸附效果
   */
  createMagneticEffect(
    element: HTMLElement,
    targetX: number,
    targetY: number
  ): Promise<void> {
    return new Promise(resolve => {
      const rect = element.getBoundingClientRect();
      const startX = rect.left;
      const startY = rect.top;
      
      const distance = Math.sqrt(
        Math.pow(targetX - startX, 2) + 
        Math.pow(targetY - startY, 2)
      );
      
      // 基于距离调整动画强度
      const intensity = Math.min(1, distance / 200);
      
      const keyframes = [
        { 
          transform: `translate(${startX}px, ${startY}px) scale(1)`,
          filter: 'brightness(1)',
          offset: 0 
        },
        { 
          transform: `translate(${startX + (targetX - startX) * 0.3}px, ${startY + (targetY - startY) * 0.3}px) scale(${1 + intensity * 0.1})`,
          filter: 'brightness(1.2)',
          offset: 0.3 
        },
        { 
          transform: `translate(${targetX}px, ${targetY}px) scale(1)`,
          filter: 'brightness(1)',
          offset: 1 
        }
      ];
      
      const animation = element.animate(keyframes, {
        duration: DURATION.normal + intensity * 200,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      });
      
      animation.addEventListener('finish', () => resolve());
    });
  }
  
  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopParticleAnimation();
    this.particles = [];
    
    if (this.canvas && document.body.contains(this.canvas)) {
      document.body.removeChild(this.canvas);
    }
  }
}

/**
 * 粒子类
 */
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  lifetime: number;
  age: number = 0;
  gravity: number;
  
  constructor(options: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    lifetime: number;
    gravity: number;
  }) {
    this.x = options.x;
    this.y = options.y;
    this.vx = options.vx;
    this.vy = options.vy;
    this.size = options.size;
    this.color = options.color;
    this.lifetime = options.lifetime;
    this.gravity = options.gravity;
  }
  
  update(): void {
    this.x += this.vx * 0.016; // 假设60fps
    this.y += this.vy * 0.016;
    this.vy += this.gravity;
    this.age += 16; // 毫秒
    
    // 添加阻力
    this.vx *= 0.99;
    this.vy *= 0.99;
  }
  
  draw(ctx: CanvasRenderingContext2D): void {
    const opacity = 1 - (this.age / this.lifetime);
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * opacity, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  isAlive(): boolean {
    return this.age < this.lifetime;
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  
  constructor(
    private onPerformanceChange: (fps: number) => void
  ) {
    this.startMonitoring();
  }
  
  private startMonitoring(): void {
    const monitor = () => {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        this.onPerformanceChange(this.fps);
      }
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }
  
  getFPS(): number {
    return this.fps;
  }
}
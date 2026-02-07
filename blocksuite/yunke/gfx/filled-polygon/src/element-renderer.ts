/**
 * FilledPolygon 渲染器
 * 
 * 使用 Canvas 2D API 渲染填充的多边形
 */

import {
    type ElementRenderer,
    ElementRendererExtension,
} from '@blocksuite/yunke-block-surface';
import { type FilledPolygonElementModel, DefaultTheme } from '@blocksuite/yunke-model';

export const filledPolygon: ElementRenderer<FilledPolygonElementModel> = (
    model,
    ctx,
    matrix,
    renderer
) => {
    const { rotate, opacity } = model;
    const [, , w, h] = model.deserializedXYWH;
    const cx = w / 2;
    const cy = h / 2;

    // 应用变换
    ctx.setTransform(
        matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
    );

    // 获取颜色
    const fillColor = renderer.getColorValue(model.fillColor, DefaultTheme.shapeStrokeColor, true);
    const strokeColor = renderer.getColorValue(model.strokeColor, 'transparent', true);

    // 设置透明度
    ctx.globalAlpha = opacity;

    // 获取路径点
    const points = model.points;
    if (!points || points.length < 3) return;

    // 开始绘制路径
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    
    // 闭合路径
    ctx.closePath();

    // 填充
    if (fillColor && fillColor !== 'transparent') {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    // 描边
    if (strokeColor && strokeColor !== 'transparent' && model.strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = model.strokeWidth;
        ctx.stroke();
    }

    // 重置透明度
    ctx.globalAlpha = 1;
};

export const FilledPolygonElementRendererExtension = ElementRendererExtension(
    'filled-polygon',
    filledPolygon
);

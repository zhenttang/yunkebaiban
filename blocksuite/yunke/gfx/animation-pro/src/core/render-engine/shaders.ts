/**
 * WebGL 着色器定义
 * 
 * 包含所有渲染所需的着色器程序
 */

// ==================== 基础顶点着色器 ====================

export const BASIC_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

uniform mat3 u_matrix;
uniform vec2 u_resolution;

out vec2 v_texCoord;

void main() {
    vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
    vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texCoord = a_texCoord;
}
`;

// ==================== 基础片段着色器 ====================

export const BASIC_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform float u_opacity;

out vec4 fragColor;

void main() {
    vec4 color = texture(u_texture, v_texCoord);
    fragColor = color * u_opacity;
}
`;

// ==================== 笔刷顶点着色器 ====================

export const BRUSH_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
in float a_pressure;
in float a_tiltX;
in float a_tiltY;
in float a_size;

uniform mat3 u_matrix;
uniform vec2 u_resolution;
uniform float u_baseSize;

out float v_pressure;
out vec2 v_tilt;
out float v_size;

void main() {
    vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
    vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    gl_PointSize = a_size * u_baseSize;
    
    v_pressure = a_pressure;
    v_tilt = vec2(a_tiltX, a_tiltY);
    v_size = a_size;
}
`;

// ==================== 笔刷片段着色器 ====================

export const BRUSH_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in float v_pressure;
in vec2 v_tilt;
in float v_size;

uniform sampler2D u_brushTexture;
uniform vec4 u_color;
uniform float u_opacity;
uniform float u_flow;
uniform float u_hardness;
uniform float u_rotation;
uniform vec2 u_roundness;
uniform bool u_useBrushTexture;

out vec4 fragColor;

// 旋转函数
vec2 rotate(vec2 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

void main() {
    vec2 uv = gl_PointCoord - 0.5;
    
    // 应用旋转
    uv = rotate(uv, u_rotation);
    
    // 应用椭圆度
    uv.x /= u_roundness.x;
    uv.y /= u_roundness.y;
    
    // 计算距离
    float dist = length(uv) * 2.0;
    
    // 压感影响
    float pressureMod = mix(0.3, 1.0, v_pressure);
    
    // 硬度渐变
    float falloff = 1.0 - smoothstep(u_hardness * pressureMod, 1.0, dist);
    
    // 笔刷纹理
    float brushAlpha = 1.0;
    if (u_useBrushTexture) {
        vec2 texCoord = gl_PointCoord;
        brushAlpha = texture(u_brushTexture, texCoord).r;
    }
    
    // 最终颜色
    vec4 color = u_color;
    color.a *= falloff * brushAlpha * u_opacity * u_flow * pressureMod;
    
    // 丢弃完全透明的像素
    if (color.a < 0.001) discard;
    
    fragColor = color;
}
`;

// ==================== 混合模式片段着色器 ====================

export const BLEND_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_srcTexture;
uniform sampler2D u_dstTexture;
uniform int u_blendMode;
uniform float u_opacity;

out vec4 fragColor;

// 混合模式函数
vec3 blendNormal(vec3 src, vec3 dst) { return src; }
vec3 blendMultiply(vec3 src, vec3 dst) { return src * dst; }
vec3 blendScreen(vec3 src, vec3 dst) { return 1.0 - (1.0 - src) * (1.0 - dst); }
vec3 blendOverlay(vec3 src, vec3 dst) {
    return mix(
        2.0 * src * dst,
        1.0 - 2.0 * (1.0 - src) * (1.0 - dst),
        step(0.5, dst)
    );
}
vec3 blendDarken(vec3 src, vec3 dst) { return min(src, dst); }
vec3 blendLighten(vec3 src, vec3 dst) { return max(src, dst); }
vec3 blendColorDodge(vec3 src, vec3 dst) { return dst / max(1.0 - src, 0.001); }
vec3 blendColorBurn(vec3 src, vec3 dst) { return 1.0 - (1.0 - dst) / max(src, 0.001); }
vec3 blendHardLight(vec3 src, vec3 dst) {
    return mix(
        2.0 * src * dst,
        1.0 - 2.0 * (1.0 - src) * (1.0 - dst),
        step(0.5, src)
    );
}
vec3 blendSoftLight(vec3 src, vec3 dst) {
    return mix(
        dst * (2.0 * src + dst * (1.0 - 2.0 * src)),
        sqrt(dst) * (2.0 * src - 1.0) + 2.0 * dst * (1.0 - src),
        step(0.5, src)
    );
}
vec3 blendDifference(vec3 src, vec3 dst) { return abs(src - dst); }
vec3 blendExclusion(vec3 src, vec3 dst) { return src + dst - 2.0 * src * dst; }
vec3 blendAdd(vec3 src, vec3 dst) { return min(src + dst, vec3(1.0)); }
vec3 blendSubtract(vec3 src, vec3 dst) { return max(dst - src, vec3(0.0)); }

// HSL 转换
vec3 rgbToHsl(vec3 c) {
    float maxC = max(max(c.r, c.g), c.b);
    float minC = min(min(c.r, c.g), c.b);
    float l = (maxC + minC) / 2.0;
    
    if (maxC == minC) return vec3(0.0, 0.0, l);
    
    float d = maxC - minC;
    float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
    float h;
    
    if (maxC == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    else if (maxC == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
    
    return vec3(h / 6.0, s, l);
}

float hueToRgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

vec3 hslToRgb(vec3 hsl) {
    if (hsl.y == 0.0) return vec3(hsl.z);
    
    float q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
    float p = 2.0 * hsl.z - q;
    
    return vec3(
        hueToRgb(p, q, hsl.x + 1.0/3.0),
        hueToRgb(p, q, hsl.x),
        hueToRgb(p, q, hsl.x - 1.0/3.0)
    );
}

vec3 blendHue(vec3 src, vec3 dst) {
    vec3 srcHsl = rgbToHsl(src);
    vec3 dstHsl = rgbToHsl(dst);
    return hslToRgb(vec3(srcHsl.x, dstHsl.y, dstHsl.z));
}

vec3 blendSaturation(vec3 src, vec3 dst) {
    vec3 srcHsl = rgbToHsl(src);
    vec3 dstHsl = rgbToHsl(dst);
    return hslToRgb(vec3(dstHsl.x, srcHsl.y, dstHsl.z));
}

vec3 blendColor(vec3 src, vec3 dst) {
    vec3 srcHsl = rgbToHsl(src);
    vec3 dstHsl = rgbToHsl(dst);
    return hslToRgb(vec3(srcHsl.x, srcHsl.y, dstHsl.z));
}

vec3 blendLuminosity(vec3 src, vec3 dst) {
    vec3 srcHsl = rgbToHsl(src);
    vec3 dstHsl = rgbToHsl(dst);
    return hslToRgb(vec3(dstHsl.x, dstHsl.y, srcHsl.z));
}

void main() {
    vec4 src = texture(u_srcTexture, v_texCoord);
    vec4 dst = texture(u_dstTexture, v_texCoord);
    
    vec3 blended;
    
    // 选择混合模式
    switch (u_blendMode) {
        case 0: blended = blendNormal(src.rgb, dst.rgb); break;
        case 1: blended = blendMultiply(src.rgb, dst.rgb); break;
        case 2: blended = blendScreen(src.rgb, dst.rgb); break;
        case 3: blended = blendOverlay(src.rgb, dst.rgb); break;
        case 4: blended = blendDarken(src.rgb, dst.rgb); break;
        case 5: blended = blendLighten(src.rgb, dst.rgb); break;
        case 6: blended = blendColorDodge(src.rgb, dst.rgb); break;
        case 7: blended = blendColorBurn(src.rgb, dst.rgb); break;
        case 8: blended = blendHardLight(src.rgb, dst.rgb); break;
        case 9: blended = blendSoftLight(src.rgb, dst.rgb); break;
        case 10: blended = blendDifference(src.rgb, dst.rgb); break;
        case 11: blended = blendExclusion(src.rgb, dst.rgb); break;
        case 12: blended = blendHue(src.rgb, dst.rgb); break;
        case 13: blended = blendSaturation(src.rgb, dst.rgb); break;
        case 14: blended = blendColor(src.rgb, dst.rgb); break;
        case 15: blended = blendLuminosity(src.rgb, dst.rgb); break;
        case 16: blended = blendAdd(src.rgb, dst.rgb); break;
        case 17: blended = blendSubtract(src.rgb, dst.rgb); break;
        default: blended = blendNormal(src.rgb, dst.rgb);
    }
    
    // Porter-Duff 合成
    float srcA = src.a * u_opacity;
    float dstA = dst.a;
    float outA = srcA + dstA * (1.0 - srcA);
    
    vec3 outRgb = (blended * srcA + dst.rgb * dstA * (1.0 - srcA)) / max(outA, 0.001);
    
    fragColor = vec4(outRgb, outA);
}
`;

// ==================== 洋葱皮着色器 ====================

export const ONION_SKIN_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform vec4 u_tintColor;
uniform float u_opacity;
uniform int u_mode;  // 0: tint, 1: outline, 2: silhouette

out vec4 fragColor;

void main() {
    vec4 color = texture(u_texture, v_texCoord);
    
    if (u_mode == 0) {
        // Tint 模式：着色但保留亮度
        float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 tinted = mix(color.rgb, u_tintColor.rgb * luminance, 0.5);
        fragColor = vec4(tinted, color.a * u_opacity);
    }
    else if (u_mode == 1) {
        // Outline 模式：只显示边缘
        vec2 texelSize = 1.0 / vec2(textureSize(u_texture, 0));
        float edge = 0.0;
        
        for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
                if (i == 0 && j == 0) continue;
                vec4 neighbor = texture(u_texture, v_texCoord + vec2(float(i), float(j)) * texelSize);
                edge += abs(color.a - neighbor.a);
            }
        }
        
        edge = smoothstep(0.0, 0.5, edge);
        fragColor = vec4(u_tintColor.rgb, edge * u_opacity);
    }
    else {
        // Silhouette 模式：纯色轮廓
        fragColor = vec4(u_tintColor.rgb, color.a * u_opacity);
    }
}
`;

// ==================== 合成着色器 ====================

export const COMPOSITE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_layers[16];
uniform float u_opacities[16];
uniform int u_layerCount;
uniform vec4 u_backgroundColor;

out vec4 fragColor;

void main() {
    vec4 result = u_backgroundColor;
    
    for (int i = 0; i < 16; i++) {
        if (i >= u_layerCount) break;
        
        vec4 layer = texture(u_layers[i], v_texCoord);
        layer.a *= u_opacities[i];
        
        // 标准 Alpha 合成
        result.rgb = layer.rgb * layer.a + result.rgb * (1.0 - layer.a);
        result.a = layer.a + result.a * (1.0 - layer.a);
    }
    
    fragColor = result;
}
`;

// ==================== 后处理着色器 ====================

export const POSTPROCESS_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform float u_gamma;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform vec3 u_colorBalance;

out vec4 fragColor;

vec3 adjustGamma(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
}

vec3 adjustBrightness(vec3 color, float brightness) {
    return color + brightness;
}

vec3 adjustContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
}

vec3 adjustSaturation(vec3 color, float saturation) {
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(luminance), color, saturation);
}

void main() {
    vec4 color = texture(u_texture, v_texCoord);
    
    vec3 result = color.rgb;
    result = adjustGamma(result, u_gamma);
    result = adjustBrightness(result, u_brightness);
    result = adjustContrast(result, u_contrast);
    result = adjustSaturation(result, u_saturation);
    result *= u_colorBalance;
    
    fragColor = vec4(clamp(result, 0.0, 1.0), color.a);
}
`;

// ==================== 网格着色器 ====================

export const GRID_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_zoom;
uniform float u_gridSize;
uniform vec4 u_gridColor;
uniform vec4 u_subGridColor;
uniform int u_subDivisions;

out vec4 fragColor;

void main() {
    vec2 worldPos = (v_texCoord * u_resolution - u_offset) / u_zoom;
    
    // 主网格
    vec2 grid = abs(fract(worldPos / u_gridSize - 0.5) - 0.5);
    float line = min(grid.x, grid.y);
    float mainGrid = 1.0 - smoothstep(0.0, 2.0 / u_zoom, line * u_gridSize);
    
    // 子网格
    float subSize = u_gridSize / float(u_subDivisions);
    vec2 subGrid = abs(fract(worldPos / subSize - 0.5) - 0.5);
    float subLine = min(subGrid.x, subGrid.y);
    float subGridAlpha = 1.0 - smoothstep(0.0, 1.0 / u_zoom, subLine * subSize);
    
    // 合成
    vec4 color = mix(
        u_subGridColor * subGridAlpha,
        u_gridColor,
        mainGrid
    );
    
    fragColor = color;
}
`;

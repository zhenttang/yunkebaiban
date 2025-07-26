// Types for SVG Avatar Generator

export interface Point {
  x: number;
  y: number;
}

export interface FaceContourResult {
  face: number[][];
  width: number;
  height: number;
  center: [number, number];
}

export interface EyePoints {
  upper: number[][];
  lower: number[][];
  center: number[][];
}

export interface BothEyes {
  left: EyePoints;
  right: EyePoints;
}

export interface EyeParameters {
  height_upper: number;
  height_lower: number;
  P0_upper_randX: number;
  P3_upper_randX: number;
  P0_upper_randY: number;
  P3_upper_randY: number;
  offset_upper_left_randY: number;
  offset_upper_right_randY: number;
  eye_true_width: number;
  offset_upper_left_x: number;
  offset_upper_right_x: number;
  offset_upper_left_y: number;
  offset_upper_right_y: number;
  offset_lower_left_x: number;
  offset_lower_right_x: number;
  offset_lower_left_y: number;
  offset_lower_right_y: number;
  left_converge0: number;
  right_converge0: number;
  left_converge1: number;
  right_converge1: number;
}

export interface SVGAvatarConfig {
  seed?: string | number;
  onGenerate?: () => void;
}
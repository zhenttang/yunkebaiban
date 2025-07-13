import { Bound, type IVec, PointLocation } from './model/index.js';
export type BezierCurveParameters = [
    start: IVec,
    control1: IVec,
    control2: IVec,
    end: IVec
];
export declare function getBezierPoint(values: BezierCurveParameters, t: number): IVec | null;
export declare function getBezierTangent(values: BezierCurveParameters, t: number): IVec | null;
export declare function getBezierNormal(values: BezierCurveParameters, t: number): IVec | null;
export declare function getBezierCurvature(values: BezierCurveParameters, t: number): number | undefined;
export declare function getBezierNearestTime(values: BezierCurveParameters, point: IVec): number;
export declare function getBezierNearestPoint(values: BezierCurveParameters, point: IVec): IVec | null;
export declare function getBezierParameters(points: PointLocation[]): BezierCurveParameters;
export declare function getBezierCurveBoundingBox(values: BezierCurveParameters): Bound;
export declare function curveIntersects(path: PointLocation[], line: [IVec, IVec]): PointLocation[] | null;
//# sourceMappingURL=curve.d.ts.map
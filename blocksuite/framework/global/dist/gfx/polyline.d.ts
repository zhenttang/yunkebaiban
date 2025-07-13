import { type IVec } from './model/index.js';
export declare class Polyline {
    static len(points: IVec[]): number;
    static lenAtPoint(points: IVec[], point: IVec): number;
    static nearestPoint(points: IVec[], point: IVec): IVec;
    static pointAt(points: IVec[], ratio: number): IVec | null;
    static pointAtLen(points: IVec[], len: number): IVec | null;
}
//# sourceMappingURL=polyline.d.ts.map
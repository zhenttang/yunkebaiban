import { type IVec } from './vec.js';
/**
 * PointLocation is an implementation of IVec with in/out vectors and tangent.
 * This is useful when dealing with path.
 */
export declare class PointLocation extends Array<number> implements IVec {
    _in: IVec;
    _out: IVec;
    _tangent: IVec;
    [0]: number;
    [1]: number;
    get absIn(): IVec;
    get absOut(): IVec;
    get in(): IVec;
    set in(value: IVec);
    get length(): 2;
    get out(): IVec;
    set out(value: IVec);
    get tangent(): IVec;
    set tangent(value: IVec);
    constructor(point?: IVec, tangent?: IVec, inVec?: IVec, outVec?: IVec);
    static fromVec(vec: IVec): PointLocation;
    clone(): PointLocation;
    setVec(vec: IVec): this;
    toVec(): IVec;
}
//# sourceMappingURL=point-location.d.ts.map
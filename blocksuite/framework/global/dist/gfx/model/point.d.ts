export interface IPoint {
    x: number;
    y: number;
}
export declare class Point {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    /**
     * Restrict a value to a certain interval.
     */
    static clamp(p: Point, min: Point, max: Point): Point;
    static from(point: IPoint | number[] | number, y?: number): Point;
    /**
     * Compares and returns the maximum of two points.
     */
    static max(a: Point, b: Point): Point;
    /**
     * Compares and returns the minimum of two points.
     */
    static min(a: Point, b: Point): Point;
    add(point: IPoint): Point;
    /**
     * Returns a copy of the point.
     */
    clone(): Point;
    cross(point: IPoint): number;
    equals({ x, y }: Point): boolean;
    lerp(point: IPoint, t: number): Point;
    scale(factor: number): Point;
    set(x: number, y: number): void;
    subtract(point: IPoint): Point;
    toArray(): number[];
}
export declare class Rect {
    max: Point;
    min: Point;
    get bottom(): number;
    set bottom(y: number);
    get height(): number;
    set height(h: number);
    get left(): number;
    set left(x: number);
    get right(): number;
    set right(x: number);
    get top(): number;
    set top(y: number);
    get width(): number;
    set width(w: number);
    constructor(left: number, top: number, right: number, bottom: number);
    static fromDOM(dom: Element): Rect;
    static fromDOMRect({ left, top, right, bottom }: DOMRect): Rect;
    static fromLTRB(left: number, top: number, right: number, bottom: number): Rect;
    static fromLWTH(left: number, width: number, top: number, height: number): Rect;
    static fromPoint(point: Point): Rect;
    static fromPoints(start: Point, end: Point): Rect;
    static fromXY(x: number, y: number): Rect;
    center(): Point;
    clamp(p: Point): Point;
    clone(): Rect;
    contains({ min, max }: Rect): boolean;
    equals({ min, max }: Rect): boolean;
    extend_with(point: Point): void;
    extend_with_x(x: number): void;
    extend_with_y(y: number): void;
    intersect(other: Rect): Rect;
    intersects({ left, top, right, bottom }: Rect): boolean;
    isPointDown({ x, y }: Point): boolean;
    isPointIn({ x, y }: Point): boolean;
    isPointLeft({ x, y }: Point): boolean;
    isPointRight({ x, y }: Point): boolean;
    isPointUp({ x, y }: Point): boolean;
    toDOMRect(): DOMRect;
}
//# sourceMappingURL=point.d.ts.map
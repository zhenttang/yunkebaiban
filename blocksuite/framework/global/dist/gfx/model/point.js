import { clamp } from '../math.js';
export class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    /**
     * Restrict a value to a certain interval.
     */
    static clamp(p, min, max) {
        return new Point(clamp(p.x, min.x, max.x), clamp(p.y, min.y, max.y));
    }
    static from(point, y) {
        if (Array.isArray(point)) {
            return new Point(point[0], point[1]);
        }
        if (typeof point === 'number') {
            return new Point(point, y ?? point);
        }
        return new Point(point.x, point.y);
    }
    /**
     * Compares and returns the maximum of two points.
     */
    static max(a, b) {
        return new Point(Math.max(a.x, b.x), Math.max(a.y, b.y));
    }
    /**
     * Compares and returns the minimum of two points.
     */
    static min(a, b) {
        return new Point(Math.min(a.x, b.x), Math.min(a.y, b.y));
    }
    add(point) {
        return new Point(this.x + point.x, this.y + point.y);
    }
    /**
     * Returns a copy of the point.
     */
    clone() {
        return new Point(this.x, this.y);
    }
    cross(point) {
        return this.x * point.y - this.y * point.x;
    }
    equals({ x, y }) {
        return this.x === x && this.y === y;
    }
    lerp(point, t) {
        return new Point(this.x + (point.x - this.x) * t, this.y + (point.y - this.y) * t);
    }
    scale(factor) {
        return new Point(this.x * factor, this.y * factor);
    }
    set(x, y) {
        this.x = x;
        this.y = y;
    }
    subtract(point) {
        return new Point(this.x - point.x, this.y - point.y);
    }
    toArray() {
        return [this.x, this.y];
    }
}
export class Rect {
    get bottom() {
        return this.max.y;
    }
    set bottom(y) {
        this.max.y = y;
    }
    get height() {
        return this.max.y - this.min.y;
    }
    set height(h) {
        this.max.y = this.min.y + h;
    }
    get left() {
        return this.min.x;
    }
    set left(x) {
        this.min.x = x;
    }
    get right() {
        return this.max.x;
    }
    set right(x) {
        this.max.x = x;
    }
    get top() {
        return this.min.y;
    }
    set top(y) {
        this.min.y = y;
    }
    get width() {
        return this.max.x - this.min.x;
    }
    set width(w) {
        this.max.x = this.min.x + w;
    }
    constructor(left, top, right, bottom) {
        const [minX, maxX] = left <= right ? [left, right] : [right, left];
        const [minY, maxY] = top <= bottom ? [top, bottom] : [bottom, top];
        this.min = new Point(minX, minY);
        this.max = new Point(maxX, maxY);
    }
    static fromDOM(dom) {
        return Rect.fromDOMRect(dom.getBoundingClientRect());
    }
    static fromDOMRect({ left, top, right, bottom }) {
        return Rect.fromLTRB(left, top, right, bottom);
    }
    static fromLTRB(left, top, right, bottom) {
        return new Rect(left, top, right, bottom);
    }
    static fromLWTH(left, width, top, height) {
        return new Rect(left, top, left + width, top + height);
    }
    static fromPoint(point) {
        return Rect.fromPoints(point.clone(), point);
    }
    static fromPoints(start, end) {
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        const left = Math.min(end.x, start.x);
        const top = Math.min(end.y, start.y);
        return Rect.fromLWTH(left, width, top, height);
    }
    static fromXY(x, y) {
        return Rect.fromPoint(new Point(x, y));
    }
    center() {
        return new Point((this.left + this.right) / 2, (this.top + this.bottom) / 2);
    }
    clamp(p) {
        return Point.clamp(p, this.min, this.max);
    }
    clone() {
        const { left, top, right, bottom } = this;
        return new Rect(left, top, right, bottom);
    }
    contains({ min, max }) {
        return this.isPointIn(min) && this.isPointIn(max);
    }
    equals({ min, max }) {
        return this.min.equals(min) && this.max.equals(max);
    }
    extend_with(point) {
        this.min = Point.min(this.min, point);
        this.max = Point.max(this.max, point);
    }
    extend_with_x(x) {
        this.min.x = Math.min(this.min.x, x);
        this.max.x = Math.max(this.max.x, x);
    }
    extend_with_y(y) {
        this.min.y = Math.min(this.min.y, y);
        this.max.y = Math.max(this.max.y, y);
    }
    intersect(other) {
        return Rect.fromPoints(Point.max(this.min, other.min), Point.min(this.max, other.max));
    }
    intersects({ left, top, right, bottom }) {
        return (this.left <= right &&
            left <= this.right &&
            this.top <= bottom &&
            top <= this.bottom);
    }
    isPointDown({ x, y }) {
        return this.bottom < y && this.left <= x && this.right >= x;
    }
    isPointIn({ x, y }) {
        return (this.left <= x && x <= this.right && this.top <= y && y <= this.bottom);
    }
    isPointLeft({ x, y }) {
        return x < this.left && this.top <= y && this.bottom >= y;
    }
    isPointRight({ x, y }) {
        return x > this.right && this.top <= y && this.bottom >= y;
    }
    isPointUp({ x, y }) {
        return y < this.top && this.left <= x && this.right >= x;
    }
    toDOMRect() {
        const { left, top, width, height } = this;
        return new DOMRect(left, top, width, height);
    }
}
//# sourceMappingURL=point.js.map
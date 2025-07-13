import type { LitElement } from 'lit';
import { DisposableGroup } from '../disposable/index.js';
import type { Constructor } from '../utils/types.js';
export declare class DisposableClass {
    protected _disposables: DisposableGroup;
    readonly disposables: DisposableGroup;
}
/**
 * Mixin that adds a `_disposables: DisposableGroup` property to the class.
 *
 * The `_disposables` property is initialized in `connectedCallback` and disposed in `disconnectedCallback`.
 *
 * see https://lit.dev/docs/composition/mixins/
 *
 * @example
 * ```ts
 * class MyElement extends WithDisposable(ShadowlessElement) {
 *   onClick() {
 *     this._disposables.add(...);
 *   }
 * }
 * ```
 */
export declare function WithDisposable<T extends Constructor<LitElement>>(SuperClass: T): T & Constructor<DisposableClass>;
//# sourceMappingURL=with-disposable.d.ts.map
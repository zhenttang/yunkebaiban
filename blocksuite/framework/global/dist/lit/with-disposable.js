import { DisposableGroup } from '../disposable/index.js';
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
export function WithDisposable(SuperClass) {
    class DerivedClass extends SuperClass {
        constructor() {
            super(...arguments);
            this._disposables = new DisposableGroup();
        }
        get disposables() {
            return this._disposables;
        }
        connectedCallback() {
            super.connectedCallback();
            if (this._disposables.disposed) {
                this._disposables = new DisposableGroup();
            }
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this._disposables.dispose();
        }
    }
    return DerivedClass;
}
//# sourceMappingURL=with-disposable.js.map
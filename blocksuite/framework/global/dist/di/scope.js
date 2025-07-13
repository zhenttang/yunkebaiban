import { ROOT_SCOPE } from './consts.js';
export function createScope(name, base = ROOT_SCOPE) {
    return [...base, name];
}
export function stringifyScope(scope) {
    return scope.join('/');
}
//# sourceMappingURL=scope.js.map
import { DEFAULT_SERVICE_VARIANT } from './consts.js';
export class RecursionLimitError extends Error {
    constructor() {
        super('Dynamic resolve recursion limit reached');
    }
}
export class CircularDependencyError extends Error {
    constructor(dependencyStack) {
        super(`A circular dependency was detected.\n` +
            stringifyDependencyStack(dependencyStack));
        this.dependencyStack = dependencyStack;
    }
}
export class ServiceNotFoundError extends Error {
    constructor(identifier) {
        super(`Service ${stringifyIdentifier(identifier)} not found in container`);
        this.identifier = identifier;
    }
}
export class MissingDependencyError extends Error {
    constructor(from, target, dependencyStack) {
        super(`Missing dependency ${stringifyIdentifier(target)} in creating service ${stringifyIdentifier(from)}.\n${stringifyDependencyStack(dependencyStack)}`);
        this.from = from;
        this.target = target;
        this.dependencyStack = dependencyStack;
    }
}
export class DuplicateServiceDefinitionError extends Error {
    constructor(identifier) {
        super(`Service ${stringifyIdentifier(identifier)} already exists`);
        this.identifier = identifier;
    }
}
function stringifyIdentifier(identifier) {
    return `[${identifier.identifierName}]${identifier.variant !== DEFAULT_SERVICE_VARIANT
        ? `(${identifier.variant})`
        : ''}`;
}
function stringifyDependencyStack(dependencyStack) {
    return dependencyStack
        .map(identifier => `${stringifyIdentifier(identifier)}`)
        .join(' -> ');
}
//# sourceMappingURL=error.js.map
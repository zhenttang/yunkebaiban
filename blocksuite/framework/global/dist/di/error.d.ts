import type { ServiceIdentifierValue } from './types.js';
export declare class RecursionLimitError extends Error {
    constructor();
}
export declare class CircularDependencyError extends Error {
    readonly dependencyStack: ServiceIdentifierValue[];
    constructor(dependencyStack: ServiceIdentifierValue[]);
}
export declare class ServiceNotFoundError extends Error {
    readonly identifier: ServiceIdentifierValue;
    constructor(identifier: ServiceIdentifierValue);
}
export declare class MissingDependencyError extends Error {
    readonly from: ServiceIdentifierValue;
    readonly target: ServiceIdentifierValue;
    readonly dependencyStack: ServiceIdentifierValue[];
    constructor(from: ServiceIdentifierValue, target: ServiceIdentifierValue, dependencyStack: ServiceIdentifierValue[]);
}
export declare class DuplicateServiceDefinitionError extends Error {
    readonly identifier: ServiceIdentifierValue;
    constructor(identifier: ServiceIdentifierValue);
}
//# sourceMappingURL=error.d.ts.map
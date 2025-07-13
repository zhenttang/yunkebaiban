export class ConsoleLogger {
    debug(message, ...args) {
        console.debug(message, ...args);
    }
    error(message, ...args) {
        console.error(message, ...args);
    }
    info(message, ...args) {
        console.info(message, ...args);
    }
    warn(message, ...args) {
        console.warn(message, ...args);
    }
}
export class NoopLogger {
    debug() { }
    error() { }
    info() { }
    warn() { }
}
//# sourceMappingURL=logger.js.map
export class NoopDocSource {
    constructor() {
        this.name = 'noop';
    }
    pull(_docId, _data) {
        return null;
    }
    push(_docId, _data) { }
    subscribe(_cb, _disconnect) {
        return () => { };
    }
}
//# sourceMappingURL=noop.js.map
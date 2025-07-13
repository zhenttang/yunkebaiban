export class AwarenessEngine {
    constructor(awareness, sources) {
        this.awareness = awareness;
        this.sources = sources;
    }
    connect() {
        this.sources.forEach(source => source.connect(this.awareness));
    }
    disconnect() {
        this.sources.forEach(source => source.disconnect());
    }
}
//# sourceMappingURL=engine.js.map
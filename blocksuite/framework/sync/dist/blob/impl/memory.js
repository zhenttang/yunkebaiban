export class MemoryBlobSource {
    constructor() {
        this.map = new Map();
        this.name = 'memory';
        this.readonly = false;
    }
    delete(key) {
        this.map.delete(key);
        return Promise.resolve();
    }
    get(key) {
        return Promise.resolve(this.map.get(key) ?? null);
    }
    list() {
        return Promise.resolve(Array.from(this.map.keys()));
    }
    set(key, value) {
        this.map.set(key, value);
        return Promise.resolve(key);
    }
}
//# sourceMappingURL=memory.js.map
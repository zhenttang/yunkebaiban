import { Subject, Subscription } from 'rxjs';
export class DisposableGroup {
    constructor() {
        this._disposables = [];
        this._disposed = false;
    }
    get disposed() {
        return this._disposed;
    }
    /**
     * Add to group to be disposed with others.
     * This will be immediately disposed if this group has already been disposed.
     */
    add(d) {
        if (this._disposed) {
            disposeMember(d);
            return;
        }
        this._disposables.push(d);
    }
    addFromEvent(target, type, handler, eventOptions) {
        this.add({
            dispose: () => {
                target.removeEventListener(type, handler, eventOptions);
            },
        });
        target.addEventListener(type, handler, eventOptions);
    }
    dispose() {
        disposeAll(this._disposables);
        this._disposables = [];
        this._disposed = true;
    }
}
export function disposeMember(disposable) {
    try {
        if (disposable instanceof Subscription) {
            disposable.unsubscribe();
        }
        else if (disposable instanceof Subject) {
            disposable.complete();
        }
        else if (typeof disposable === 'function') {
            disposable();
        }
        else {
            disposable.dispose();
        }
    }
    catch (e) {
        console.error(e);
    }
}
function disposeAll(disposables) {
    disposables.forEach(disposeMember);
}
//# sourceMappingURL=index.js.map
import { Subject, Subscription } from 'rxjs';
type DisposeCallback = () => void;
export interface Disposable {
    dispose: DisposeCallback;
}
export type DisposableMember = Disposable | Subscription | Subject<any> | DisposeCallback;
export declare class DisposableGroup {
    private _disposables;
    private _disposed;
    get disposed(): boolean;
    /**
     * Add to group to be disposed with others.
     * This will be immediately disposed if this group has already been disposed.
     */
    add(d: DisposableMember): void;
    addFromEvent<N extends keyof WindowEventMap>(element: Window, eventName: N, handler: (e: WindowEventMap[N]) => void, options?: boolean | AddEventListenerOptions): void;
    addFromEvent<N extends keyof DocumentEventMap>(element: Document, eventName: N, handler: (e: DocumentEventMap[N]) => void, eventOptions?: boolean | AddEventListenerOptions): void;
    addFromEvent<N extends keyof HTMLElementEventMap>(element: HTMLElement, eventName: N, handler: (e: HTMLElementEventMap[N]) => void, eventOptions?: boolean | AddEventListenerOptions): void;
    addFromEvent<N extends keyof VisualViewportEventMap>(element: VisualViewport, eventName: N, handler: (e: VisualViewportEventMap[N]) => void, eventOptions?: boolean | AddEventListenerOptions): void;
    addFromEvent<N extends keyof VirtualKeyboardEventMap>(element: VirtualKeyboard, eventName: N, handler: (e: VirtualKeyboardEventMap[N]) => void, eventOptions?: boolean | AddEventListenerOptions): void;
    dispose(): void;
}
export declare function disposeMember(disposable: DisposableMember): void;
export {};
//# sourceMappingURL=index.d.ts.map
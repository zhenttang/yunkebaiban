/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import { type Signal } from '@preact/signals-core';
import { AsyncDirective } from 'lit/async-directive.js';
declare class WatchDirective extends AsyncDirective {
    private __signal?;
    private __dispose?;
    render(signal: Signal<unknown>): unknown;
    protected disconnected(): void;
    protected reconnected(): void;
}
/**
 * Renders a signal and subscribes to it, updating the part when the signal
 * changes.
 */
export declare const watch: (signal: Signal<unknown>) => import("lit-html/directive.js").DirectiveResult<typeof WatchDirective>;
export {};
//# sourceMappingURL=watch.d.ts.map
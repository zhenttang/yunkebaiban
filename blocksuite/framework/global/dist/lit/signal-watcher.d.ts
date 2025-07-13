/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import type { ReactiveElement } from 'lit';
type ReactiveElementConstructor = abstract new (...args: any[]) => ReactiveElement;
/**
 * Adds the ability for a LitElement or other ReactiveElement class to
 * watch for access to Preact signals during the update lifecycle and
 * trigger a new update when signals values change.
 */
export declare function SignalWatcher<T extends ReactiveElementConstructor>(Base: T): T;
export {};
//# sourceMappingURL=signal-watcher.d.ts.map
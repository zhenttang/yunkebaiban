import { DebugLogger } from '@yunke/debug';
// @ts-expect-error upstream type is wrong
import { createKeybindingsHandler } from 'tinykeys';

import type { YunkeCommand, YunkeCommandOptions } from './command';
import { createYunkeCommand } from './command';

const commandLogger = new DebugLogger('command:registry');

interface KeyBindingMap {
  [keybinding: string]: (event: KeyboardEvent) => void;
}

export interface KeyBindingOptions {
  /**
   * Key presses will listen to this event (default: "keydown").
   */
  event?: 'keydown' | 'keyup';

  /**
   * Whether to capture the event during the capture phase (default: false).
   */
  capture?: boolean;

  /**
   * Keybinding sequences will wait this long between key presses before
   * cancelling (default: 1000).
   *
   * **Note:** Setting this value too low (i.e. `300`) will be too fast for many
   * of your users.
   */
  timeout?: number;
}

const bindKeys = (
  target: Window | HTMLElement,
  keyBindingMap: KeyBindingMap,
  options: KeyBindingOptions = {}
) => {
  const event = options.event ?? 'keydown';
  const onKeyEvent = createKeybindingsHandler(keyBindingMap, options);
  target.addEventListener(event, onKeyEvent, options.capture);
  return () => {
    target.removeEventListener(event, onKeyEvent, options.capture);
  };
};

export const YunkeCommandRegistry = new (class {
  readonly commands: Map<string, YunkeCommand> = new Map();

  register(options: YunkeCommandOptions) {
    if (this.commands.has(options.id)) {
      commandLogger.warn(`Command ${options.id} already registered.`);
      return () => {};
    }
    const command = createYunkeCommand(options);
    this.commands.set(command.id, command);

    let unsubKb: (() => void) | undefined;

    if (
      command.keyBinding &&
      !command.keyBinding.skipRegister &&
      typeof window !== 'undefined'
    ) {
      const { binding: keybinding, capture } = command.keyBinding;
      unsubKb = bindKeys(
        window,
        {
          [keybinding]: (e: Event) => {
            e.preventDefault();
            command.run()?.catch(e => {
              console.error(`Failed to run command [${command.id}]`, e);
            });
          },
        },
        {
          capture,
        }
      );
    }

    return () => {
      unsubKb?.();
      this.commands.delete(command.id);
    };
  }

  get(id: string): YunkeCommand | undefined {
    if (!this.commands.has(id)) {
      commandLogger.warn(`Command ${id} not registered.`);
      return undefined;
    }
    return this.commands.get(id);
  }

  getAll(): YunkeCommand[] {
    return Array.from(this.commands.values());
  }
})();

export function registerYunkeCommand(options: YunkeCommandOptions) {
  return YunkeCommandRegistry.register(options);
}

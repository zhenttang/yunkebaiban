import type {
  Blocker,
  Listener,
  Location,
  MemoryHistory,
  MemoryHistoryOptions,
  To,
} from 'history';
import { Action, createPath, parsePath } from 'history';

export interface NavigableHistory extends MemoryHistory {
  entries: Location[];
}

/**
 * 与`history`包中的`createMemoryHistory`相同，但带有额外的`entries`属性。
 *
 * 原始的`MemoryHistory`没有`entries`属性，所以我们无法获取`backable`和`forwardable`状态，
 * 这些状态是实现返回和前进按钮所必需的。
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#creatememoryhistory
 */
export function createNavigableHistory(
  options: MemoryHistoryOptions = {}
): NavigableHistory {
  const { initialEntries = ['/'], initialIndex } = options;
  const entries: Location[] = initialEntries.map(entry => {
    const location = Object.freeze<Location>({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: createKey(),
      ...(typeof entry === 'string' ? parsePath(entry) : entry),
    });

    warning(
      location.pathname.charAt(0) === '/',
      `createMemoryHistory({ initialEntries })不支持相对路径名（无效条目：${JSON.stringify(
        entry
      )})`
    );

    return location;
  });
  let index = clamp(
    initialIndex == null ? entries.length - 1 : initialIndex,
    0,
    entries.length - 1
  );

  let action = Action.Pop;
  let location = entries[index];
  const listeners = createEvents<Listener>();
  const blockers = createEvents<Blocker>();

  function createHref(to: To) {
    return typeof to === 'string' ? to : createPath(to);
  }

  function getNextLocation(to: To, state: any = null): Location {
    return Object.freeze<Location>({
      pathname: location.pathname,
      search: '',
      hash: '',
      ...(typeof to === 'string' ? parsePath(to) : to),
      state,
      key: createKey(),
    });
  }

  function allowTx(action: Action, location: Location, retry: () => void) {
    return (
      !blockers.length || (blockers.call({ action, location, retry }), false)
    );
  }

  function applyTx(nextAction: Action, nextLocation: Location) {
    action = nextAction;
    location = nextLocation;
    listeners.call({ action, location });
  }

  function push(to: To, state?: any) {
    const nextAction = Action.Push;
    const nextLocation = getNextLocation(to, state);
    function retry() {
      push(to, state);
    }

    warning(
      location.pathname.charAt(0) === '/',
      `内存历史记录中不支持相对路径名.push(${JSON.stringify(
        to
      )})`
    );

    if (allowTx(nextAction, nextLocation, retry)) {
      index += 1;
      entries.splice(index, entries.length, nextLocation);
      applyTx(nextAction, nextLocation);
    }
  }

  function replace(to: To, state?: any) {
    const nextAction = Action.Replace;
    const nextLocation = getNextLocation(to, state);
    function retry() {
      replace(to, state);
    }

    warning(
      location.pathname.charAt(0) === '/',
      `内存历史记录中不支持相对路径名.replace(${JSON.stringify(
        to
      )})`
    );

    if (allowTx(nextAction, nextLocation, retry)) {
      entries[index] = nextLocation;
      applyTx(nextAction, nextLocation);
    }
  }

  function go(delta: number) {
    const nextIndex = clamp(index + delta, 0, entries.length - 1);
    const nextAction = Action.Pop;
    const nextLocation = entries[nextIndex];
    function retry() {
      go(delta);
    }

    if (allowTx(nextAction, nextLocation, retry)) {
      index = nextIndex;
      applyTx(nextAction, nextLocation);
    }
  }

  const history: NavigableHistory = {
    get index() {
      return index;
    },
    get action() {
      return action;
    },
    get location() {
      return location;
    },
    get entries() {
      return entries;
    },
    createHref,
    push,
    replace,
    go,
    back() {
      go(-1);
    },
    forward() {
      go(1);
    },
    listen(listener) {
      return listeners.push(listener);
    },
    block(blocker) {
      return blockers.push(blocker);
    },
  };

  return history;
}

function createKey() {
  return Math.random().toString(36).substr(2, 8);
}

function warning(cond: any, message: string) {
  if (!cond) {
    if (typeof console !== 'undefined') console.warn(message);

    try {
      // 欢迎调试历史记录！
      //
      // 抛出此错误是为了方便您更容易
      // 通过在JavaScript调试器中启用"异常时暂停"
      // 找到控制台中出现的警告的来源。
      throw new Error(message);
    } catch {}
  }
}

function clamp(n: number, lowerBound: number, upperBound: number) {
  return Math.min(Math.max(n, lowerBound), upperBound);
}

type Events<F> = {
  length: number;
  push: (fn: F) => () => void;
  call: (arg: any) => void;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function createEvents<F extends Function>(): Events<F> {
  let handlers: F[] = [];

  return {
    get length() {
      return handlers.length;
    },
    push(fn: F) {
      handlers.push(fn);
      return function () {
        handlers = handlers.filter(handler => handler !== fn);
      };
    },
    call(arg) {
      handlers.forEach(fn => fn && fn(arg));
    },
  };
}

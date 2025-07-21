import { Unreachable } from '@affine/env/constant';

export interface RcRef<T> extends Disposable {
  obj: T;
  release: () => void;
}

export class ObjectPool<Key, T> {
  objects = new Map<Key, { obj: T; rc: number }>();
  timeoutToGc: NodeJS.Timeout | null = null;

  constructor(
    private readonly options: {
      onDelete?: (obj: T) => void;
      onDangling?: (obj: T) => boolean;
    } = {}
  ) {}

  get(key: Key): RcRef<T> | null {
    const exist = this.objects.get(key);
    if (exist) {
      exist.rc++;
      let released = false;
      const release = () => {
        // 避免重复释放
        if (released) {
          return;
        }
        released = true;
        exist.rc--;
        this.requestGc();
      };
      return {
        obj: exist.obj,
        release,
        [Symbol.dispose]: release,
      };
    }
    return null;
  }

  put(key: Key, obj: T) {
    const ref = { obj, rc: 0 };
    this.objects.set(key, ref);

    const r = this.get(key);
    if (!r) {
      throw new Unreachable();
    }

    return r;
  }

  private requestGc() {
    if (this.timeoutToGc) {
      clearInterval(this.timeoutToGc);
    }

    // 每1秒执行一次gc
    this.timeoutToGc = setInterval(() => {
      this.gc();
    }, 1000);
  }

  private gc() {
    for (const [key, { obj, rc }] of new Map(
      this.objects /* 克隆映射，因为原始映射在迭代过程中将被修改 */
    )) {
      if (
        rc === 0 &&
        (!this.options.onDangling || this.options.onDangling(obj))
      ) {
        this.options.onDelete?.(obj);

        this.objects.delete(key);
      }
    }

    for (const [_, { rc }] of this.objects) {
      if (rc === 0) {
        return;
      }
    }

    // 如果所有对象都有引用者，停止gc
    if (this.timeoutToGc) {
      clearInterval(this.timeoutToGc);
    }
  }

  clear() {
    for (const { obj } of this.objects.values()) {
      this.options.onDelete?.(obj);
    }

    this.objects.clear();
  }
}

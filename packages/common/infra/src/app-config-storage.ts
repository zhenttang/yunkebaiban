import { z } from 'zod';

export const appConfigSchema = z.object({
  /** 是否显示新手引导 */
  onBoarding: z.boolean().optional().default(true),
});

export type AppConfigSchema = z.infer<typeof appConfigSchema>;
export const defaultAppConfig = appConfigSchema.parse({});

const _storage: Record<number, any> = {};
let _inMemoryId = 0;

interface StorageOptions<T> {
  /** 默认配置 */
  config: T;
  get?: () => T;
  set?: (data: T) => void;
}

/**
 * 应用程序配置的存储，默认存储在内存中
 */
class Storage<T extends object> {
  private _cfg: T;
  private readonly _id = _inMemoryId++;
  private readonly _options;

  constructor(options: StorageOptions<T>) {
    this._options = {
      get: () => _storage[this._id],
      set: (data: T) => (_storage[this._id] = data),
      ...options,
    };
    this._cfg = this.get() ?? options.config;
  }

  /**
   * update entire config
   * @param data
   */
  set(data: T) {
    try {
      this._options.set(data);
    } catch (err) {
      console.error('failed to save config', err);
    }
    this._cfg = data;
  }

  get(): T;
  get<K extends keyof T>(key: K): T[K];
  /**
   * get config, if key is provided, return the value of the key
   * @param key
   * @returns
   */
  get(key?: keyof T): T | T[keyof T] {
    if (!key) {
      try {
        const cfg = this._options.get();
        if (!cfg) {
          this.set(this._options.config);
          return this._options.config;
        }
        return cfg;
      } catch {
        return this._cfg;
      }
    } else {
      const fullConfig = this.get();
      // TODO(@catsjuice): handle key not found, set default value
      // if (!(key in fullConfig)) {}
      return fullConfig[key];
    }
  }

  /**
   * update a key in config
   * @param key
   * @param value
   */
  patch(key: keyof T, value: any) {
    this.set({ ...this.get(), [key]: value });
  }

  get value(): T {
    return this.get();
  }
}

export class AppConfigStorage extends Storage<AppConfigSchema> {}

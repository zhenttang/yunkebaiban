import { stableHash } from '../../utils/stable-hash';
import type { Component } from './components/component';
import { DEFAULT_VARIANT } from './consts';
import type {
  ComponentVariant,
  Identifier,
  IdentifierValue,
  Type,
} from './types';

/**
 * 创建一个标识符。
 *
 * 标识符用于标识某一类型的服务。通过标识符，您可以在不了解具体实现的情况下引用一个或多个服务，
 * 从而实现[控制反转](https://en.wikipedia.org/wiki/Inversion_of_control)。
 *
 * @example
 * ```ts
 * // 定义一个接口
 * interface Storage {
 *   get(key: string): string | null;
 *   set(key: string, value: string): void;
 * }
 *
 * // 创建一个标识符
 * // 注意：强烈建议使用接口名作为标识符名称，
 * // 这样更容易理解。在TypeScript中这样做是合法的。
 * const Storage = createIdentifier<Storage>('Storage');
 *
 * // 创建一个实现
 * class LocalStorage implements Storage {
 *   get(key: string): string | null {
 *     return localStorage.getItem(key);
 *   }
 *   set(key: string, value: string): void {
 *     localStorage.setItem(key, value);
 *   }
 * }
 *
 * // 将实现注册到标识符
 * framework.impl(Storage, LocalStorage);
 *
 * // 从标识符获取实现
 * const storage = framework.provider().get(Storage);
 * storage.set('foo', 'bar');
 * ```
 *
 * 使用标识符的好处：
 *
 * * 您可以轻松地替换`Storage`的实现，而无需更改使用它的代码。
 * * 您可以轻松地模拟`Storage`进行测试。
 *
 * # 变体
 *
 * 有时，您可能希望为同一个接口注册多个实现。
 * 例如，您可能希望在`Storage`接口上同时具有`LocalStorage`和`SessionStorage`。
 *
 * 在这种情况下，您可以使用`variant`来区分它们。
 *
 * ```ts
 * const Storage = createIdentifier<Storage>('Storage');
 * const LocalStorage = Storage('local');
 * const SessionStorage = Storage('session');
 *
 * framework.impl(LocalStorage, LocalStorageImpl);
 * framework.impl(SessionStorage, SessionStorageImpl);
 *
 * // 从标识符获取实现
 * const localStorage = framework.provider().get(LocalStorage);
 * const sessionStorage = framework.provider().get(SessionStorage);
 * const storage = framework.provider().getAll(Storage); // { local: LocalStorageImpl, session: SessionStorageImpl }
 * ```
 *
 * @param name 标识符的唯一名称。
 * @param variant 标识符的默认变体名称，可以通过`identifier("variant")`覆盖。
 */
export function createIdentifier<T>(
  name: string,
  variant: ComponentVariant = DEFAULT_VARIANT
): Identifier<T> & ((variant: ComponentVariant) => Identifier<T>) {
  return Object.assign(
    (variant: ComponentVariant) => {
      return createIdentifier<T>(name, variant);
    },
    {
      identifierName: name,
      variant,
    }
  ) as any;
}

/**
 * 将构造函数转换为服务标识符。
 * 因为在DI容器中我们始终处理的是服务标识符。
 *
 * @internal
 */
export function createIdentifierFromConstructor<T extends Component>(
  target: Type<T>
): Identifier<T> {
  return createIdentifier<T>(`${target.name}${stableHash(target)}`);
}

export function parseIdentifier(input: any): IdentifierValue {
  if (input.identifierName) {
    return input as IdentifierValue;
  } else if (typeof input === 'function' && input.name) {
    return createIdentifierFromConstructor(input);
  } else {
    throw new Error('输入不是一个服务标识符。');
  }
}

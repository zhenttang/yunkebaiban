// 复制自 https://github.com/shuding/stable-hash

// 使用WeakMap存储对象-键映射，这样对象仍然可以被
// 垃圾回收。WeakMap底层使用哈希表，所以查找
// 复杂度几乎是O(1)。
const table = new WeakMap<object, string>();

// 键的计数器。
let counter = 0;

// 一个稳定的哈希实现，支持：
//  - 快速并确保唯一哈希属性
//  - 处理不可序列化的值
//  - 处理对象键顺序
//  - 生成简短结果
//
// 这不是一个序列化函数，结果不保证可解析。
export function stableHash(arg: any): string {
  const type = typeof arg;
  const constructor = arg && arg.constructor;
  const isDate = constructor === Date;

  if (Object(arg) === arg && !isDate && constructor !== RegExp) {
    // 对象/函数，不是null/date/regexp。首先使用WeakMap存储id。
    // 如果已经被哈希化，直接返回结果。
    let result = table.get(arg);
    if (result) return result;
    // 在进入递归`stableHash`调用之前，首先存储哈希以检测循环引用。
    // For other objects like set and map, we use this id directly as the hash.
    result = ++counter + '~';
    table.set(arg, result);
    let index: any;

    if (constructor === Array) {
      // Array.
      result = '@';
      for (index = 0; index < arg.length; index++) {
        result += stableHash(arg[index]) + ',';
      }
      table.set(arg, result);
    } else if (constructor === Object) {
      // Object, sort keys.
      result = '#';
      const keys = Object.keys(arg).sort();
      while ((index = keys.pop() as string) !== undefined) {
        if (arg[index] !== undefined) {
          result += index + ':' + stableHash(arg[index]) + ',';
        }
      }
      table.set(arg, result);
    }
    return result;
  }
  if (isDate) return arg.toJSON();
  if (type === 'symbol') return arg.toString();
  return type === 'string' ? JSON.stringify(arg) : '' + arg;
}

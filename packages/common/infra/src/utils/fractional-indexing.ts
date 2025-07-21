import { generateKeyBetween } from 'fractional-indexing';

function hasSamePrefix(a: string, b: string) {
  return a.startsWith(b) || b.startsWith(a);
}

/**
 * 在a和b之间生成一个键，结果键始终满足 a < result < b。
 * 该键始终具有随机后缀，因此无需担心冲突。
 *
 * 确保 a 和 b 是由此函数生成的。
 *
 * @param customPostfix 键的自定义后缀，只允许字母和数字
 */
export function generateFractionalIndexingKeyBetween(
  a: string | null,
  b: string | null
) {
  const randomSize = 32;
  function postfix(length: number = randomSize) {
    const chars =
      '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(values[i] % chars.length);
    }
    return result;
  }

  if (a !== null && b !== null && a >= b) {
    throw new Error('a should be smaller than b');
  }

  // get the subkey in full key
  // e.g.
  // a0xxxx -> a
  // a0x0xxxx -> a0x
  function subkey(key: string | null) {
    if (key === null) {
      return null;
    }
    if (key.length <= randomSize + 1) {
      // no subkey
      return key;
    }
    const splitAt = key.substring(0, key.length - randomSize - 1);
    return splitAt;
  }

  const aSubkey = subkey(a);
  const bSubkey = subkey(b);

  if (aSubkey === null && bSubkey === null) {
    // generate a new key
    return generateKeyBetween(null, null) + '0' + postfix();
  } else if (aSubkey === null && bSubkey !== null) {
    // generate a key before b
    return generateKeyBetween(null, bSubkey) + '0' + postfix();
  } else if (bSubkey === null && aSubkey !== null) {
    // generate a key after a
    return generateKeyBetween(aSubkey, null) + '0' + postfix();
  } else if (aSubkey !== null && bSubkey !== null) {
    // generate a key between a and b
    if (hasSamePrefix(aSubkey, bSubkey) && a !== null && b !== null) {
      // conflict, if the subkeys are the same, generate a key between fullkeys
      return generateKeyBetween(a, b) + '0' + postfix();
    } else {
      return generateKeyBetween(aSubkey, bSubkey) + '0' + postfix();
    }
  }
  throw new Error('Never reach here');
}

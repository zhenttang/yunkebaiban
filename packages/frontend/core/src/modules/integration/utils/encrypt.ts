/**
 * PBKDF2 加密函数
 * @param source - 待加密的原始字符串
 * @param secret - 盐值（不应硬编码，从环境变量或配置读取）
 * @param iterations - 迭代次数
 */
export async function encryptPBKDF2(
  source: string,
  secret: string = (typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_ENCRYPT_SECRET) ||
    'yunke-' + location.hostname,
  iterations = 100000
) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(source),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const salt = encoder.encode(secret);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

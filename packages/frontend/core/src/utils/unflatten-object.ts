const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function unflattenObject(ob: Record<string, unknown>) {
  const result: Record<string, unknown> = Object.create(null);

  for (const key in ob) {
    if (!Object.prototype.hasOwnProperty.call(ob, key)) continue;

    const keys = key.split('.');
    if (keys.some(k => DANGEROUS_KEYS.has(k))) {
      console.warn(`[unflattenObject] 跳过危险键: ${key}`);
      continue;
    }

    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];

      if (i === keys.length - 1) {
        current[k] = ob[key];
      } else {
        if (
          typeof current[k] !== 'object' ||
          current[k] === null ||
          Array.isArray(current[k])
        ) {
          current[k] = Object.create(null);
        }
        current = current[k] as Record<string, unknown>;
      }
    }
  }

  return result;
}

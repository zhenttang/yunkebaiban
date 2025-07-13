/**
 * 检查名称是否与查询字符串模糊匹配。
 *
 * @example
 * ```ts
 * const name = 'John Smith';
 * const query = 'js';
 * const isMatch = fuzzyMatch(name, query);
 * // isMatch: true
 * ```
 *
 * 如果 initialMatch = true，则第一个字符也必须匹配
 */
export function fuzzyMatch(
  name: string,
  query: string,
  matchInitial?: boolean
) {
  const pureName = [...name.trim().toLowerCase()]
    .filter(char => char !== ' ')
    .join('');

  const regex = new RegExp(
    [...query]
      .filter(char => char !== ' ')
      .map(item => `${escapeRegExp(item)}.*`)
      .join(''),
    'i'
  );

  if (matchInitial && query.length > 0 && !pureName.startsWith(query[0])) {
    return false;
  }

  return regex.test(pureName);
}

function escapeRegExp(input: string) {
  // 转义输入字符串中的正则表达式字符，以防止正则表达式格式错误
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

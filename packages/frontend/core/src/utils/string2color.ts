export function stringToColour(str: string) {
  str = str || 'yunke';
  let colour = '#';
  let hash = 0;
  // str 转换为 hash
  for (
    let i = 0;
    i < str.length;
    hash = str.charCodeAt(i++) + ((hash << 5) - hash)
  );

  // int/hash 转换为十六进制
  for (
    let i = 0;
    i < 3;
    colour += ('00' + ((hash >> (i++ * 8)) & 0xff).toString(16)).slice(-2)
  );

  return colour;
}

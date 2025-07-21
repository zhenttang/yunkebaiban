const createFakeElement = (text: string) => {
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const fakeElement = document.createElement('textarea');
  // 防止在 iOS 上缩放
  fakeElement.style.fontSize = '12pt';
  // 重置盒模型
  fakeElement.style.border = '0';
  fakeElement.style.padding = '0';
  fakeElement.style.margin = '0';
  // 将元素水平移出屏幕
  fakeElement.style.position = 'absolute';
  fakeElement.style[isRTL ? 'right' : 'left'] = '-9999px';
  // 将元素垂直移动到相同位置
  const yPosition = window.pageYOffset || document.documentElement.scrollTop;
  fakeElement.style.top = `${yPosition}px`;

  fakeElement.setAttribute('readonly', '');
  fakeElement.value = text;

  return fakeElement;
};

function command(type: string) {
  try {
    return document.execCommand(type);
  } catch (err) {
    console.error(err);
    return false;
  }
}

export const fakeCopyAction = (text: string, container = document.body) => {
  let success = false;

  const fakeElement = createFakeElement(text);
  container.append(fakeElement);

  try {
    fakeElement.select();
    fakeElement.setSelectionRange(0, fakeElement.value.length);
    success = command('copy');
  } catch (err) {
    console.error(err);
  }

  fakeElement.remove();

  return success;
};

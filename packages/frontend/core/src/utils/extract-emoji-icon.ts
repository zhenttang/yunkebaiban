import Graphemer from 'graphemer';

export function extractEmojiIcon(text: string) {
  const isStartsWithEmoji = /^(\p{Emoji_Presentation})/u.test(text);
  if (isStartsWithEmoji) {
    // 类似"👨🏻‍❤️‍💋‍👨🏻"的表情符号是组合的。Graphemer 可以处理这些。
    const emojiEnd = Graphemer.nextBreak(text, 0);
    return {
      emoji: text.substring(0, emojiEnd),
      rest: text.substring(emojiEnd),
    };
  }
  return {
    emoji: null,
    rest: text,
  };
}

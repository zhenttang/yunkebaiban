// 常用 Emoji 图标集合
export const EMOJI_ICONS = {
  // 笑脸系列
  smile: '😊',
  laugh: '😂', 
  wink: '😉',
  cool: '😎',
  kiss: '😘',
  
  // 手势系列
  thumbsUp: '👍',
  ok: '👌',
  peace: '✌️',
  pray: '🙏',
  clap: '👏',
  
  // 心形系列
  heart: '❤️',
  heartEyes: '😍',
  heartBreak: '💔',
  
  // 其他常用
  fire: '🔥',
  star: '⭐',
  gem: '💎',
  rose: '🌹',
  
  // 情绪表达
  surprised: '😲',
  confused: '😕',
  angry: '😡',
  sad: '😢',
  tired: '😴',
  
  // 动物
  cat: '🐱',
  dog: '🐶',
  panda: '🐼',
  
  // 食物
  apple: '🍎',
  pizza: '🍕',
  coffee: '☕',
};

// 使用示例
export const EmojiButton = ({ type, onClick }) => (
  <button onClick={onClick} className="emoji-btn">
    {EMOJI_ICONS[type]}
  </button>
);
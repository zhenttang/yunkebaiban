/**
 * 注册所有标题增强功能的自定义元素
 * 这个文件需要在应用启动时被导入
 */

import '../../../packages/frontend/core/src/modules/heading-enhancements/heading-level-suggestion';
import '../../../packages/frontend/core/src/modules/heading-enhancements/word-count-display';
import '../../../packages/frontend/core/src/modules/heading-enhancements/advanced-collapse';
import '../../../packages/frontend/core/src/modules/heading-enhancements/emoji-enhancement';
import '../../../packages/frontend/core/src/modules/heading-enhancements/document-structure-visualization';

// 注册自定义元素
customElements.define('heading-level-suggestion', 
  (await import('../../../packages/frontend/core/src/modules/heading-enhancements/heading-level-suggestion')).HeadingLevelSuggestion
);

customElements.define('word-count-display', 
  (await import('../../../packages/frontend/core/src/modules/heading-enhancements/word-count-display')).WordCountDisplay
);

customElements.define('advanced-collapse', 
  (await import('../../../packages/frontend/core/src/modules/heading-enhancements/advanced-collapse')).AdvancedCollapse
);

customElements.define('emoji-enhancement', 
  (await import('../../../packages/frontend/core/src/modules/heading-enhancements/emoji-enhancement')).EmojiEnhancement
);

customElements.define('document-structure-visualization', 
  (await import('../../../packages/frontend/core/src/modules/heading-enhancements/document-structure-visualization')).DocumentStructureVisualization
);

console.log('标题增强功能组件已注册完成');
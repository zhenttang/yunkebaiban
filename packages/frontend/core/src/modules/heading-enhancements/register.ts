/**
 * 注册标题增强功能
 * 在应用启动时自动注册所有组件
 */


// 延迟注册组件，避免循环依赖
setTimeout(() => {
  try {
    // 异步导入和注册组件
    import('./heading-level-suggestion').then(({ HeadingLevelSuggestion }) => {
      if (!customElements.get('heading-level-suggestion')) {
        customElements.define('heading-level-suggestion', HeadingLevelSuggestion);
      }
    }).catch(console.error);

    import('./word-count-display').then(({ WordCountDisplay }) => {
      if (!customElements.get('word-count-display')) {
        customElements.define('word-count-display', WordCountDisplay);
      }
    }).catch(console.error);

    import('./advanced-collapse').then(({ AdvancedCollapse }) => {
      if (!customElements.get('advanced-collapse')) {
        customElements.define('advanced-collapse', AdvancedCollapse);
      }
    }).catch(console.error);

    import('./emoji-enhancement').then(({ EmojiEnhancement }) => {
      if (!customElements.get('emoji-enhancement')) {
        customElements.define('emoji-enhancement', EmojiEnhancement);
      }
    }).catch(console.error);

    import('./document-structure-visualization').then(({ DocumentStructureVisualization }) => {
      if (!customElements.get('document-structure-visualization')) {
        customElements.define('document-structure-visualization', DocumentStructureVisualization);
      }
    }).catch(console.error);

  } catch (error) {
    console.error('标题增强组件注册失败:', error);
  }
}, 100);
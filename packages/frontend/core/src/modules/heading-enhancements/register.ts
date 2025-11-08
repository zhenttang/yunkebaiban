/**
 * 注册标题增强功能
 * 在应用启动时自动注册所有组件
 */


// 延迟注册组件，避免循环依赖
setTimeout(() => {
  try {
    // 异步导入和注册组件
    // ⚠️ 以下组件因装饰器错误暂时禁用
    /*
    import('./heading-level-suggestion').then(({ HeadingLevelSuggestion }) => {
      if (!customElements.get('heading-level-suggestion')) {
        console.log('✅ [heading-enhancements] 注册 heading-level-suggestion 组件');
        customElements.define('heading-level-suggestion', HeadingLevelSuggestion);
      }
    }).catch(error => {
      console.error('❌ [heading-enhancements] heading-level-suggestion 组件注册失败:', error);
    });

    import('./word-count-display').then(({ WordCountDisplay }) => {
      if (!customElements.get('word-count-display')) {
        console.log('✅ [heading-enhancements] 注册 word-count-display 组件');
        customElements.define('word-count-display', WordCountDisplay);
      }
    }).catch(error => {
      console.error('❌ [heading-enhancements] word-count-display 组件注册失败:', error);
      // 继续尝试注册其他组件，不让一个组件失败影响整个应用
    });

    import('./advanced-collapse').then(({ AdvancedCollapse }) => {
      if (!customElements.get('advanced-collapse')) {
        console.log('✅ [heading-enhancements] 注册 advanced-collapse 组件');
        customElements.define('advanced-collapse', AdvancedCollapse);
      }
    }).catch(error => {
      console.error('❌ [heading-enhancements] advanced-collapse 组件注册失败:', error);
    });

    import('./emoji-enhancement').then(({ EmojiEnhancement }) => {
      if (!customElements.get('emoji-enhancement')) {
        console.log('✅ [heading-enhancements] 注册 emoji-enhancement 组件');
        customElements.define('emoji-enhancement', EmojiEnhancement);
      }
    }).catch(error => {
      console.error('❌ [heading-enhancements] emoji-enhancement 组件注册失败:', error);
    });

    import('./document-structure-visualization').then(({ DocumentStructureVisualization }) => {
      if (!customElements.get('document-structure-visualization')) {
        console.log('✅ [heading-enhancements] 注册 document-structure-visualization 组件');
        customElements.define('document-structure-visualization', DocumentStructureVisualization);
      }
    }).catch(error => {
      console.error('❌ [heading-enhancements] document-structure-visualization 组件注册失败:', error);
    });
    */

  } catch (error) {
    console.error('❌ [heading-enhancements] 标题增强组件注册整体失败:', error);
  }
}, 100);
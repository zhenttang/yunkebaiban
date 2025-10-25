/**
 * 浏览器内存修复效果测试脚本
 * 
 * 使用方法：
 * 1. 打开 http://localhost:8081
 * 2. 按 F12 打开控制台
 * 3. 复制粘贴此脚本到控制台并回车
 */

(function() {
  console.clear();
  console.log('%c🧪 YUNKE 内存修复效果测试', 'font-size: 20px; font-weight: bold; color: #1e96ed;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1e96ed;');
  console.log('');

  // 1. 样式标签统计
  console.log('%c📊 样式标签统计', 'font-size: 16px; font-weight: bold; color: #4caf50;');
  const totalStyles = document.querySelectorAll('style').length;
  const shadowlessStyles = document.querySelectorAll('style[data-yunke-style-hash]').length;
  const otherStyles = totalStyles - shadowlessStyles;
  const styleImprovement = ((1 - totalStyles/538) * 100).toFixed(1);

  console.log('  总样式标签数:', totalStyles);
  console.log('    └─ ShadowlessElement 管理:', shadowlessStyles, '个');
  console.log('    └─ 其他来源:', otherStyles, '个');
  console.log('  修复前基准:', '538 个');
  console.log('  改善效果:', styleImprovement > 0 ? `✅ 减少 ${styleImprovement}%` : '⚠️ 未改善');
  
  if (totalStyles < 100) {
    console.log('  %c✅ 优秀！样式标签数量控制良好', 'color: green; font-weight: bold;');
  } else if (totalStyles < 200) {
    console.log('  %c⚠️ 良好，但仍有优化空间', 'color: orange; font-weight: bold;');
  } else {
    console.log('  %c🔴 需要进一步优化', 'color: red; font-weight: bold;');
  }
  console.log('');

  // 2. HEAD 元素统计
  console.log('%c📦 HEAD 元素统计', 'font-size: 16px; font-weight: bold; color: #4caf50;');
  const headChildren = document.head.children.length;
  const headImprovement = ((1 - headChildren/561) * 100).toFixed(1);
  
  console.log('  HEAD 子元素总数:', headChildren);
  console.log('  修复前基准:', '561 个');
  console.log('  改善效果:', headImprovement > 0 ? `✅ 减少 ${headImprovement}%` : '⚠️ 未改善');
  console.log('');

  // 3. CSS 内容大小
  console.log('%c📄 CSS 内容大小', 'font-size: 16px; font-weight: bold; color: #4caf50;');
  let totalCSSSize = 0;
  document.querySelectorAll('style').forEach(s => {
    totalCSSSize += (s.textContent || '').length;
  });
  const cssSizeKB = (totalCSSSize / 1024).toFixed(2);
  const cssImprovement = ((1 - totalCSSSize/1024/655) * 100).toFixed(1);
  
  console.log('  CSS 总大小:', cssSizeKB, 'KB');
  console.log('  修复前基准:', '655 KB');
  console.log('  改善效果:', cssImprovement > 0 ? `✅ 减少 ${cssImprovement}%` : '⚠️ 未改善');
  console.log('');

  // 4. 内存使用
  console.log('%c💾 JavaScript 堆内存', 'font-size: 16px; font-weight: bold; color: #4caf50;');
  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize;
    const total = performance.memory.totalJSHeapSize;
    const limit = performance.memory.jsHeapSizeLimit;
    const usedMB = (used / 1024 / 1024).toFixed(2);
    const totalMB = (total / 1024 / 1024).toFixed(2);
    const limitMB = (limit / 1024 / 1024).toFixed(2);
    const usagePercent = (used / total * 100).toFixed(1);
    const memoryImprovement = ((1 - used/1024/1024/173) * 100).toFixed(1);
    
    console.log('  已使用:', usedMB, 'MB');
    console.log('  已分配:', totalMB, 'MB');
    console.log('  使用率:', usagePercent + '%');
    console.log('  限制:', limitMB, 'MB');
    console.log('  修复前基准:', '173 MB (89.5% 使用率)');
    console.log('  改善效果:', memoryImprovement > 0 ? `✅ 减少 ${memoryImprovement}%` : '⚠️ 未改善');
    
    if (usagePercent < 70) {
      console.log('  %c✅ 优秀！内存使用健康', 'color: green; font-weight: bold;');
    } else if (usagePercent < 85) {
      console.log('  %c⚠️ 中等，可以接受', 'color: orange; font-weight: bold;');
    } else {
      console.log('  %c🔴 偏高，需要优化', 'color: red; font-weight: bold;');
    }
  } else {
    console.log('  %c⚠️ 浏览器不支持 performance.memory API', 'color: orange;');
    console.log('  提示: 使用 Chrome 并启动时添加 --enable-precise-memory-info 参数');
  }
  console.log('');

  // 5. DOM 节点统计
  console.log('%c🌳 DOM 节点统计', 'font-size: 16px; font-weight: bold; color: #4caf50;');
  const domNodes = document.querySelectorAll('*').length;
  console.log('  总 DOM 节点:', domNodes);
  console.log('  状态:', domNodes < 1500 ? '✅ 正常' : domNodes < 3000 ? '⚠️ 偏多' : '🔴 过多');
  console.log('');

  // 6. 检查修复是否生效
  console.log('%c🔍 修复验证', 'font-size: 16px; font-weight: bold; color: #4caf50;');
  const hasHashedStyles = shadowlessStyles > 0;
  console.log('  去重机制:', hasHashedStyles ? '✅ 已激活' : '🔴 未激活');
  console.log('  带哈希标识的样式:', shadowlessStyles, '个');
  
  if (hasHashedStyles) {
    console.log('  %c✅ 修复已生效！样式去重机制正在工作', 'color: green; font-weight: bold;');
  } else {
    console.log('  %c⚠️ 修复可能未生效，请检查构建和刷新浏览器', 'color: orange; font-weight: bold;');
  }
  console.log('');

  // 7. 总结和评分
  console.log('%c📋 总结报告', 'font-size: 18px; font-weight: bold; color: #ff9800;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const scores = {
    styles: totalStyles < 100 ? 10 : totalStyles < 200 ? 7 : totalStyles < 300 ? 5 : 3,
    css: cssImprovement > 50 ? 10 : cssImprovement > 30 ? 7 : cssImprovement > 10 ? 5 : 3,
    memory: performance.memory ? 
      (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize < 0.7 ? 10 : 
       performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize < 0.85 ? 7 : 5) : 5,
    fix: hasHashedStyles ? 10 : 0
  };
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = 40;
  const scorePercent = (totalScore / maxScore * 100).toFixed(0);
  
  console.log('  评分项:');
  console.log('    样式标签控制:', scores.styles + '/10', scores.styles >= 7 ? '✅' : '⚠️');
  console.log('    CSS 大小优化:', scores.css + '/10', scores.css >= 7 ? '✅' : '⚠️');
  console.log('    内存使用:', scores.memory + '/10', scores.memory >= 7 ? '✅' : '⚠️');
  console.log('    修复机制:', scores.fix + '/10', scores.fix >= 7 ? '✅' : '⚠️');
  console.log('');
  console.log('  %c总分: ' + totalScore + '/' + maxScore + ' (' + scorePercent + '%)', 
    'font-size: 16px; font-weight: bold; color: ' + 
    (scorePercent >= 80 ? 'green' : scorePercent >= 60 ? 'orange' : 'red'));
  
  if (scorePercent >= 80) {
    console.log('  %c🎉 优秀！内存优化效果显著！', 'font-size: 14px; color: green; font-weight: bold;');
  } else if (scorePercent >= 60) {
    console.log('  %c👍 良好！还有进一步优化空间', 'font-size: 14px; color: orange; font-weight: bold;');
  } else {
    console.log('  %c⚠️ 需要检查修复是否正确应用', 'font-size: 14px; color: red; font-weight: bold;');
  }
  console.log('');

  // 8. 对比表格
  console.log('%c📊 修复前后对比', 'font-size: 16px; font-weight: bold; color: #2196f3;');
  console.table({
    '样式标签数': { '修复前': 538, '当前': totalStyles, '改善': styleImprovement + '%' },
    'HEAD元素数': { '修复前': 561, '当前': headChildren, '改善': headImprovement + '%' },
    'CSS大小(KB)': { '修复前': 655, '当前': cssSizeKB, '改善': cssImprovement + '%' },
    'JS堆内存(MB)': { 
      '修复前': 173, 
      '当前': performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A',
      '改善': performance.memory ? memoryImprovement + '%' : 'N/A'
    }
  });
  console.log('');

  // 9. 建议
  console.log('%c💡 建议和后续步骤', 'font-size: 16px; font-weight: bold; color: #9c27b0;');
  
  if (totalStyles > 100) {
    console.log('  • 样式标签仍然较多，考虑实施样式提取方案');
  }
  
  if (!hasHashedStyles) {
    console.log('  • ⚠️ 去重机制未激活，请检查:');
    console.log('    1. 确认代码已正确修改');
    console.log('    2. 重新构建项目 (npm run build)');
    console.log('    3. 硬刷新浏览器 (Ctrl+Shift+R)');
  }
  
  if (performance.memory && performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize > 0.7) {
    console.log('  • 内存使用率仍然较高，建议:');
    console.log('    1. 定期清理未使用的样式');
    console.log('    2. 考虑实施懒加载机制');
  }
  
  console.log('  • 持续监控内存使用情况');
  console.log('  • 查看详细测试指南: MEMORY_FIX_TEST_GUIDE.md');
  console.log('');

  // 10. 额外工具
  console.log('%c🛠️ 实用工具函数', 'font-size: 16px; font-weight: bold; color: #607d8b;');
  console.log('  在控制台可以使用以下函数:');
  console.log('');
  console.log('  window.yunkeMemoryTest()       - 重新运行此测试');
  console.log('  window.yunkeStyleAnalysis()    - 详细样式分析');
  console.log('  window.yunkeMemoryMonitor()    - 启动实时内存监控');
  console.log('');

  // 添加工具函数到 window
  window.yunkeMemoryTest = arguments.callee;
  
  window.yunkeStyleAnalysis = function() {
    console.clear();
    console.log('%c📊 详细样式分析', 'font-size: 18px; font-weight: bold;');
    console.log('');
    
    const styles = Array.from(document.querySelectorAll('style'));
    const bySource = {};
    
    styles.forEach(style => {
      let source = 'unknown';
      const content = style.textContent || '';
      
      if (style.dataset.yunkeStyleHash) source = 'ShadowlessElement';
      else if (content.includes('yunke-')) source = 'yunke-components';
      else if (content.includes('@emotion')) source = 'emotion';
      else if (content.includes('radix')) source = 'radix-ui';
      else if (content.includes('@font-face')) source = 'fonts';
      else if (content.includes(':root')) source = 'theme-vars';
      
      bySource[source] = (bySource[source] || 0) + 1;
    });
    
    console.log('样式来源分布:');
    console.table(bySource);
    
    console.log('\n样式大小分布:');
    const sizes = styles.map(s => ({
      size: (s.textContent || '').length,
      hasHash: !!s.dataset.yunkeStyleHash,
      preview: (s.textContent || '').substring(0, 50) + '...'
    })).sort((a, b) => b.size - a.size).slice(0, 10);
    
    console.table(sizes);
  };
  
  window.yunkeMemoryMonitor = function(interval = 5000) {
    console.log('%c⏱️ 启动内存监控 (每 ' + (interval/1000) + ' 秒)', 'font-weight: bold;');
    console.log('提示: 使用 clearInterval(window.memoryMonitorId) 停止监控');
    console.log('');
    
    if (window.memoryMonitorId) {
      clearInterval(window.memoryMonitorId);
    }
    
    let count = 0;
    window.memoryMonitorId = setInterval(() => {
      count++;
      const styles = document.querySelectorAll('style').length;
      
      if (performance.memory) {
        const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const percent = (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize * 100).toFixed(1);
        console.log(`[${count}] 内存: ${used} MB (${percent}%), 样式: ${styles}`);
      } else {
        console.log(`[${count}] 样式标签: ${styles}`);
      }
    }, interval);
    
    return window.memoryMonitorId;
  };

  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1e96ed;');
  console.log('%c测试完成！', 'font-size: 16px; font-weight: bold; color: #4caf50;');
  console.log('');

  // 返回测试结果对象
  return {
    totalStyles,
    shadowlessStyles,
    otherStyles,
    headChildren,
    cssSizeKB: parseFloat(cssSizeKB),
    domNodes,
    memory: performance.memory ? {
      usedMB: parseFloat((performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)),
      totalMB: parseFloat((performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)),
      usagePercent: parseFloat((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize * 100).toFixed(1))
    } : null,
    improvements: {
      styles: parseFloat(styleImprovement),
      head: parseFloat(headImprovement),
      css: parseFloat(cssImprovement),
      memory: performance.memory ? parseFloat(memoryImprovement) : null
    },
    score: {
      total: totalScore,
      max: maxScore,
      percent: parseFloat(scorePercent)
    },
    fixActive: hasHashedStyles
  };
})();


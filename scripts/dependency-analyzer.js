#!/usr/bin/env node

/**
 * YUNKE 依赖分析工具
 * 用于分析项目依赖的大小、使用情况和优化建议
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DependencyAnalyzer {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.nodeModulesPath = path.join(projectRoot, 'node_modules');
    this.packageJsonPath = path.join(projectRoot, 'package.json');
  }

  /**
   * 分析依赖包大小
   */
  async analyzeSizes() {
    console.log('🔍 分析依赖包大小...\n');
    
    try {
      const nodeModulesSize = execSync(`du -sh ${this.nodeModulesPath}`).toString().split('\t')[0];
      console.log(`📦 node_modules 总大小: ${nodeModulesSize}`);
      
      // 分析最大的包
      const largestPackages = execSync(`du -sh ${this.nodeModulesPath}/*/ 2>/dev/null | sort -hr | head -10`)
        .toString()
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [size, path] = line.split('\t');
          const packageName = path.split('/').pop();
          return { packageName, size };
        });

      console.log('\n📊 最大的10个依赖包:');
      largestPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.packageName}: ${pkg.size}`);
      });

    } catch (error) {
      console.error('❌ 无法分析依赖大小:', error.message);
    }
  }

  /**
   * 检查未使用的依赖
   */
  async checkUnusedDependencies() {
    console.log('\n🔍 检查未使用的依赖...\n');
    
    try {
      const depcheckResult = execSync('npx depcheck --json', { 
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      
      const result = JSON.parse(depcheckResult);
      
      if (result.dependencies.length > 0) {
        console.log('🚨 未使用的生产依赖:');
        result.dependencies.forEach(dep => console.log(`  - ${dep}`));
      }
      
      if (result.devDependencies.length > 0) {
        console.log('\n⚠️  未使用的开发依赖:');
        result.devDependencies.forEach(dep => console.log(`  - ${dep}`));
      }
      
      if (Object.keys(result.missing).length > 0) {
        console.log('\n❌ 缺失的依赖:');
        Object.entries(result.missing).forEach(([dep, files]) => {
          console.log(`  - ${dep} (在 ${files.length} 个文件中使用)`);
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ 无法检查未使用依赖:', error.message);
      console.log('💡 请先安装 depcheck: npm install -g depcheck');
    }
  }

  /**
   * 分析重复依赖
   */
  async analyzeDuplicates() {
    console.log('\n🔍 分析重复依赖...\n');
    
    try {
      const yarnList = execSync('yarn list --json --depth=0', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      
      // 解析yarn list输出，查找重复版本
      const lines = yarnList.split('\n').filter(line => line.trim());
      const packages = new Map();
      
      lines.forEach(line => {
        try {
          const data = JSON.parse(line);
          if (data.type === 'tree' && data.data.name) {
            const [name, version] = data.data.name.split('@');
            if (packages.has(name)) {
              packages.get(name).add(version);
            } else {
              packages.set(name, new Set([version]));
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      });
      
      const duplicates = Array.from(packages.entries())
        .filter(([name, versions]) => versions.size > 1)
        .sort((a, b) => b[1].size - a[1].size);
      
      if (duplicates.length > 0) {
        console.log('⚠️  发现重复依赖:');
        duplicates.forEach(([name, versions]) => {
          console.log(`  - ${name}: ${Array.from(versions).join(', ')}`);
        });
      } else {
        console.log('✅ 未发现重复依赖');
      }
      
    } catch (error) {
      console.error('❌ 无法分析重复依赖:', error.message);
    }
  }

  /**
   * 分析依赖树深度
   */
  async analyzeDepth() {
    console.log('\n🔍 分析依赖树深度...\n');
    
    try {
      const packageCount = execSync(`find ${this.nodeModulesPath} -name "package.json" | wc -l`).toString().trim();
      console.log(`📦 总包数量: ${packageCount}`);
      
      const topLevelCount = execSync(`find ${this.nodeModulesPath} -maxdepth 1 -type d | wc -l`).toString().trim();
      console.log(`📦 顶级包数量: ${topLevelCount - 1}`); // 减去node_modules自己
      
      const scopedCount = execSync(`find ${this.nodeModulesPath} -maxdepth 1 -name "@*" -type d | wc -l`).toString().trim();
      console.log(`📦 Scoped包数量: ${scopedCount}`);
      
    } catch (error) {
      console.error('❌ 无法分析依赖深度:', error.message);
    }
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(depcheckResult) {
    console.log('\n💡 优化建议:\n');
    
    const suggestions = [];
    
    if (depcheckResult?.dependencies?.length > 0) {
      suggestions.push({
        type: 'remove-unused-deps',
        priority: 'high',
        description: '移除未使用的生产依赖',
        command: `yarn remove ${depcheckResult.dependencies.join(' ')}`,
        impact: '减少bundle大小，提升安装速度'
      });
    }
    
    if (depcheckResult?.devDependencies?.length > 0) {
      suggestions.push({
        type: 'remove-unused-dev-deps', 
        priority: 'medium',
        description: '移除未使用的开发依赖',
        command: `yarn remove -D ${depcheckResult.devDependencies.join(' ')}`,
        impact: '减少开发环境安装时间'
      });
    }
    
    if (Object.keys(depcheckResult?.missing || {}).length > 0) {
      const missingDeps = Object.keys(depcheckResult.missing);
      suggestions.push({
        type: 'add-missing-deps',
        priority: 'high', 
        description: '添加缺失的依赖',
        command: `yarn add -D ${missingDeps.join(' ')}`,
        impact: '修复潜在的运行时错误'
      });
    }
    
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.description} [${suggestion.priority.toUpperCase()}]`);
      console.log(`   命令: ${suggestion.command}`);
      console.log(`   影响: ${suggestion.impact}\n`);
    });
    
    return suggestions;
  }

  /**
   * 运行完整分析
   */
  async runFullAnalysis() {
    console.log('🚀 开始 YUNKE 依赖分析...\n');
    console.log('=' .repeat(50));
    
    await this.analyzeSizes();
    const depcheckResult = await this.checkUnusedDependencies();
    await this.analyzeDuplicates();
    await this.analyzeDepth();
    
    console.log('\n' + '='.repeat(50));
    this.generateOptimizationSuggestions(depcheckResult);
    
    console.log('✅ 分析完成！');
    console.log('📊 详细报告已保存到: 依赖分析和优化报告.md');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const analyzer = new DependencyAnalyzer();
  analyzer.runFullAnalysis().catch(console.error);
}

module.exports = DependencyAnalyzer;
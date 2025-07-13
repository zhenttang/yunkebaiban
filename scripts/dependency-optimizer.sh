#!/bin/bash

# AFFiNE 依赖优化脚本
# 此脚本提供了一系列工具来分析和优化项目依赖

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查工具是否安装
check_tool() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装: $2"
        exit 1
    fi
}

# 安装必要的工具
install_tools() {
    log_info "检查并安装必要的依赖分析工具..."
    
    # 检查depcheck
    if ! command -v depcheck &> /dev/null; then
        log_warning "depcheck 未安装，正在安装..."
        npm install -g depcheck
    fi
    
    # 检查yarn-deduplicate
    if ! command -v yarn-deduplicate &> /dev/null; then
        log_warning "yarn-deduplicate 未安装，正在安装..."
        npm install -g yarn-deduplicate
    fi
    
    log_success "工具安装完成"
}

# 分析依赖大小
analyze_size() {
    log_info "分析依赖包大小..."
    
    if [ -d "node_modules" ]; then
        echo "📦 node_modules 总大小:"
        du -sh node_modules/
        
        echo -e "\n📊 最大的10个依赖包:"
        du -sh node_modules/*/ 2>/dev/null | sort -hr | head -10
        
        echo -e "\n📈 按类型统计:"
        echo "Scoped 包数量: $(find node_modules -maxdepth 1 -name "@*" -type d | wc -l)"
        echo "总包数量: $(find node_modules -maxdepth 1 -type d | wc -l)"
        echo "WebAssembly 文件: $(find node_modules -name "*.wasm" | wc -l)"
        echo "原生二进制文件: $(find node_modules -name "*.so" -o -name "*.dylib" -o -name "*.dll" | wc -l)"
    else
        log_error "node_modules 目录不存在，请先运行 yarn install"
        exit 1
    fi
}

# 检查未使用的依赖
check_unused() {
    log_info "检查未使用的依赖..."
    
    if command -v depcheck &> /dev/null; then
        echo "运行 depcheck 分析..."
        depcheck . --json > /tmp/depcheck-result.json
        
        # 解析结果
        if command -v jq &> /dev/null; then
            echo -e "\n🚨 未使用的生产依赖:"
            jq -r '.dependencies[]' /tmp/depcheck-result.json 2>/dev/null || echo "无"
            
            echo -e "\n⚠️  未使用的开发依赖:"
            jq -r '.devDependencies[]' /tmp/depcheck-result.json 2>/dev/null || echo "无"
            
            echo -e "\n❌ 缺失的依赖:"
            jq -r '.missing | keys[]' /tmp/depcheck-result.json 2>/dev/null || echo "无"
        else
            depcheck .
        fi
    else
        log_error "depcheck 未安装，请运行: npm install -g depcheck"
    fi
}

# 查找重复依赖
find_duplicates() {
    log_info "查找重复依赖..."
    
    if command -v yarn-deduplicate &> /dev/null; then
        echo "检查可以去重的依赖..."
        yarn-deduplicate --list
    else
        log_warning "yarn-deduplicate 未安装，使用替代方法..."
        # 使用yarn list查找重复版本
        yarn list --pattern="*" --depth=0 2>/dev/null | grep -E "^\w" | sort | uniq -d || echo "未发现明显重复"
    fi
}

# 清理依赖
cleanup_dependencies() {
    log_info "清理依赖..."
    
    # 清理node_modules
    if [ -d "node_modules" ]; then
        log_warning "删除 node_modules..."
        rm -rf node_modules
    fi
    
    # 清理yarn缓存
    log_info "清理 yarn 缓存..."
    yarn cache clean
    
    # 重新安装
    log_info "重新安装依赖..."
    yarn install
    
    log_success "依赖清理完成"
}

# 去重依赖
deduplicate_deps() {
    log_info "去重依赖..."
    
    if command -v yarn-deduplicate &> /dev/null; then
        yarn-deduplicate yarn.lock
        yarn install
        log_success "依赖去重完成"
    else
        log_error "yarn-deduplicate 未安装，请运行: npm install -g yarn-deduplicate"
    fi
}

# 生成依赖报告
generate_report() {
    log_info "生成依赖分析报告..."
    
    local report_file="dependency-analysis-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 依赖分析报告
生成时间: $(date)

## 基本信息
- 项目路径: $(pwd)
- Node.js 版本: $(node --version)
- Yarn 版本: $(yarn --version)

## 依赖统计
EOF
    
    if [ -d "node_modules" ]; then
        echo "- node_modules 大小: $(du -sh node_modules/ | cut -f1)" >> "$report_file"
        echo "- 顶级包数量: $(find node_modules -maxdepth 1 -type d | wc -l)" >> "$report_file"
        echo "- Scoped 包数量: $(find node_modules -maxdepth 1 -name "@*" -type d | wc -l)" >> "$report_file"
    fi
    
    echo -e "\n## 最大的依赖包" >> "$report_file"
    if [ -d "node_modules" ]; then
        du -sh node_modules/*/ 2>/dev/null | sort -hr | head -10 >> "$report_file"
    fi
    
    log_success "报告已生成: $report_file"
}

# 检查潜在的优化机会
check_optimization_opportunities() {
    log_info "检查优化机会..."
    
    echo "🔍 分析结果:"
    
    # 检查是否有大型包可以替代
    if [ -d "node_modules/@babel" ]; then
        log_warning "发现 @babel 包，考虑完全迁移到 SWC"
    fi
    
    if [ -d "node_modules/@aws-sdk" ]; then
        log_warning "发现 @aws-sdk 包，检查是否真的需要"
    fi
    
    # 检查是否有测试相关的包在生产依赖中
    local test_packages=("jest" "mocha" "jasmine" "karma" "cypress" "@testing-library")
    for pkg in "${test_packages[@]}"; do
        if grep -q "\"$pkg\"" package.json && grep -A 50 "\"dependencies\":" package.json | grep -q "\"$pkg\""; then
            log_warning "测试包 $pkg 在生产依赖中，考虑移到 devDependencies"
        fi
    done
    
    log_success "优化检查完成"
}

# 主菜单
show_menu() {
    echo -e "\n${BLUE}=== AFFiNE 依赖优化工具 ===${NC}\n"
    echo "1. 安装必要工具"
    echo "2. 分析依赖大小" 
    echo "3. 检查未使用的依赖"
    echo "4. 查找重复依赖"
    echo "5. 清理并重装依赖"
    echo "6. 去重依赖"
    echo "7. 生成分析报告"
    echo "8. 检查优化机会"
    echo "9. 运行完整分析"
    echo "0. 退出"
    echo
}

# 运行完整分析
run_full_analysis() {
    log_info "开始完整依赖分析..."
    
    install_tools
    analyze_size
    check_unused
    find_duplicates
    check_optimization_opportunities
    generate_report
    
    log_success "完整分析完成！"
}

# 主程序
main() {
    if [ $# -eq 0 ]; then
        # 交互模式
        while true; do
            show_menu
            read -p "请选择操作 (0-9): " choice
            
            case $choice in
                1) install_tools ;;
                2) analyze_size ;;
                3) check_unused ;;
                4) find_duplicates ;;
                5) cleanup_dependencies ;;
                6) deduplicate_deps ;;
                7) generate_report ;;
                8) check_optimization_opportunities ;;
                9) run_full_analysis ;;
                0) log_info "退出程序"; exit 0 ;;
                *) log_error "无效选择，请重新输入" ;;
            esac
            
            echo -e "\n按 Enter 继续..."
            read
        done
    else
        # 命令行模式
        case $1 in
            "install") install_tools ;;
            "size") analyze_size ;;
            "unused") check_unused ;;
            "duplicates") find_duplicates ;;
            "cleanup") cleanup_dependencies ;;
            "dedupe") deduplicate_deps ;;
            "report") generate_report ;;
            "optimize") check_optimization_opportunities ;;
            "full") run_full_analysis ;;
            *) 
                echo "用法: $0 [install|size|unused|duplicates|cleanup|dedupe|report|optimize|full]"
                exit 1
                ;;
        esac
    fi
}

# 执行主程序
main "$@"
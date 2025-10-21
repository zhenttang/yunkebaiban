#!/bin/bash

# Theme CSS Variables Fix Script
# 修复 Yunke 主题 CSS 变量问题

set -e

echo "=== Yunke Theme CSS Variables Fix Script ==="
echo ""

# 保存当前目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📍 Working directory: $SCRIPT_DIR"
echo ""

# Step 1: Backup current theme dist
echo "📦 Step 1: Backing up current theme dist..."
if [ -d "packages/theme/dist" ]; then
  timestamp=$(date +%Y%m%d_%H%M%S)
  mv packages/theme/dist "packages/theme/dist.backup.$timestamp"
  echo "   ✓ Backup created: packages/theme/dist.backup.$timestamp"
else
  echo "   ℹ No existing dist directory to backup"
fi
echo ""

# Step 2: Clean theme package
echo "🧹 Step 2: Cleaning theme package..."
cd packages/theme
rm -rf dist node_modules/.cache .tsbuildinfo
echo "   ✓ Theme package cleaned"
cd ../..
echo ""

# Step 3: Rebuild theme package
echo "🔨 Step 3: Rebuilding theme package..."
cd packages/theme
yarn build
if [ $? -eq 0 ]; then
  echo "   ✓ Theme package built successfully"
else
  echo "   ✗ Theme build failed!"
  exit 1
fi
cd ../..
echo ""

# Step 4: Verify dist files
echo "🔍 Step 4: Verifying dist files..."
if [ -f "packages/theme/dist/style.css" ]; then
  css_size=$(wc -c < "packages/theme/dist/style.css")
  echo "   ✓ style.css exists (${css_size} bytes)"
  
  # Check if --yunke-white exists in CSS
  if grep -q "\-\-yunke\-white:" "packages/theme/dist/style.css"; then
    echo "   ✓ --yunke-white found in style.css"
  else
    echo "   ⚠ --yunke-white NOT found in style.css"
  fi
else
  echo "   ✗ style.css not found!"
  exit 1
fi

if [ -f "packages/theme/dist/index.js" ]; then
  echo "   ✓ index.js exists"
else
  echo "   ✗ index.js not found!"
  exit 1
fi
echo ""

# Step 5: Check if variables are exported
echo "📋 Step 5: Checking exported variables..."
if command -v node &> /dev/null; then
  node -e "
    const theme = require('./packages/theme/dist/index.cjs');
    const whiteVars = Object.keys(theme.combinedLightCssVariables || {})
      .filter(k => k.includes('white'));
    console.log('   ℹ Found ' + whiteVars.length + ' white-related variables');
    if (whiteVars.includes('--yunke-white')) {
      console.log('   ✓ --yunke-white is exported');
    } else {
      console.log('   ✗ --yunke-white is NOT exported');
    }
  "
else
  echo "   ⚠ Node.js not available for verification"
fi
echo ""

# Step 6: Clear frontend cache
echo "🗑️  Step 6: Clearing frontend cache..."
rm -rf packages/frontend/core/.next
rm -rf packages/frontend/core/out
rm -rf node_modules/.cache
echo "   ✓ Frontend cache cleared"
echo ""

# Step 7: Instructions for next steps
echo "✅ Theme rebuild completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your dev server: yarn dev"
echo "   2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "   3. In browser console, run:"
echo "      getComputedStyle(document.documentElement).getPropertyValue('--yunke-white')"
echo ""
echo "   If the issue persists, run in browser console:"
echo "      window.__forceRefreshYunkeTheme?.()"
echo ""
echo "=== Script completed ==="


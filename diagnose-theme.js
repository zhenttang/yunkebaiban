// Theme CSS Variables Diagnostic Script
// Run this in your browser console to diagnose theme issues

console.log('=== Yunke Theme CSS Variables Diagnostic ===\n');

// 1. Check if style element exists
const styleEl = document.getElementById('yunke-theme-css-variables');
console.log('1. Dynamic style element exists:', !!styleEl);
if (styleEl) {
  console.log('   Content length:', styleEl.textContent?.length || 0);
  console.log('   Sample content:', styleEl.textContent?.substring(0, 200) + '...');
}

// 2. Check computed styles
const root = document.documentElement;
const computedStyle = getComputedStyle(root);

const testVars = [
  '--yunke-white',
  '--yunke-black',
  '--yunke-primary-color',
  '--yunke-background-primary-color',
  '--affine-v2-layer-white'
];

console.log('\n2. Computed CSS Variables:');
testVars.forEach(varName => {
  const value = computedStyle.getPropertyValue(varName);
  console.log(`   ${varName}: "${value}" ${value ? '✓' : '✗'}`);
});

// 3. Check theme attribute
console.log('\n3. Current theme attribute:', root.getAttribute('data-theme') || 'not set');

// 4. Check if CSS files are loaded
console.log('\n4. Loaded stylesheets:');
Array.from(document.styleSheets).forEach((sheet, i) => {
  try {
    const href = sheet.href || 'inline';
    const isTheme = href.includes('theme') || href.includes('style.css');
    if (isTheme || i < 5) {
      console.log(`   [${i}] ${href.substring(href.lastIndexOf('/') + 1)}`);
    }
  } catch (e) {
    console.log(`   [${i}] (CORS blocked)`);
  }
});

// 5. Check if refresh function exists
console.log('\n5. Refresh function available:', typeof window.__forceRefreshYunkeTheme);

// 6. Suggest fixes
console.log('\n=== Suggested Fixes ===');
if (typeof window.__forceRefreshYunkeTheme === 'function') {
  console.log('Try running: window.__forceRefreshYunkeTheme()');
} else {
  console.log('Theme refresh function not available.');
}

if (!styleEl) {
  console.log('Dynamic theme injection may have failed. Check if @toeverything/theme is loaded.');
}

const whiteValue = computedStyle.getPropertyValue('--yunke-white');
if (!whiteValue || whiteValue.trim() === '') {
  console.log('\nTo manually inject theme variables:');
  console.log('1. Rebuild theme package: cd packages/theme && yarn build');
  console.log('2. Rebuild frontend: yarn dev');
  console.log('3. Hard refresh browser (Ctrl+Shift+R)');
}

console.log('\n=== End Diagnostic ===');


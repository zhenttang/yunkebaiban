@echo off
REM Theme CSS Variables Fix Script for Windows
REM 修复 Yunke 主题 CSS 变量问题

echo === Yunke Theme CSS Variables Fix Script ===
echo.

cd /d %~dp0
echo 📍 Working directory: %CD%
echo.

REM Step 1: Backup current theme dist
echo 📦 Step 1: Backing up current theme dist...
if exist "packages\theme\dist" (
  for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
  for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
  set timestamp=%mydate%_%mytime%
  move "packages\theme\dist" "packages\theme\dist.backup.%timestamp%"
  echo    ✓ Backup created
) else (
  echo    ℹ No existing dist directory to backup
)
echo.

REM Step 2: Clean theme package
echo 🧹 Step 2: Cleaning theme package...
cd packages\theme
if exist "dist" rmdir /s /q dist
if exist "node_modules\.cache" rmdir /s /q node_modules\.cache
if exist ".tsbuildinfo" del /q .tsbuildinfo
echo    ✓ Theme package cleaned
cd ..\..
echo.

REM Step 3: Rebuild theme package
echo 🔨 Step 3: Rebuilding theme package...
cd packages\theme
call yarn build
if %errorlevel% equ 0 (
  echo    ✓ Theme package built successfully
) else (
  echo    ✗ Theme build failed!
  cd ..\..
  exit /b 1
)
cd ..\..
echo.

REM Step 4: Verify dist files
echo 🔍 Step 4: Verifying dist files...
if exist "packages\theme\dist\style.css" (
  echo    ✓ style.css exists
  findstr /C:"--yunke-white:" "packages\theme\dist\style.css" >nul
  if %errorlevel% equ 0 (
    echo    ✓ --yunke-white found in style.css
  ) else (
    echo    ⚠ --yunke-white NOT found in style.css
  )
) else (
  echo    ✗ style.css not found!
  exit /b 1
)

if exist "packages\theme\dist\index.js" (
  echo    ✓ index.js exists
) else (
  echo    ✗ index.js not found!
  exit /b 1
)
echo.

REM Step 5: Clear frontend cache
echo 🗑️  Step 5: Clearing frontend cache...
if exist "packages\frontend\core\.next" rmdir /s /q packages\frontend\core\.next
if exist "packages\frontend\core\out" rmdir /s /q packages\frontend\core\out
if exist "node_modules\.cache" rmdir /s /q node_modules\.cache
echo    ✓ Frontend cache cleared
echo.

REM Final instructions
echo ✅ Theme rebuild completed!
echo.
echo 📝 Next steps:
echo    1. Restart your dev server: yarn dev
echo    2. Hard refresh your browser (Ctrl+Shift+R)
echo    3. In browser console, run:
echo       getComputedStyle(document.documentElement).getPropertyValue('--yunke-white')
echo.
echo    If the issue persists, run in browser console:
echo       window.__forceRefreshYunkeTheme?.()
echo.
echo === Script completed ===
pause


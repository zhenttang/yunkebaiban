@echo off
echo ========================================
echo   YUNKE Desktop - Build Script
echo ========================================
echo.

cd /d %~dp0

echo [1/6] Cleaning old build files...
echo.
if exist "packages\frontend\apps\electron\dist" rmdir /s /q "packages\frontend\apps\electron\dist" 2>nul
if exist "packages\frontend\apps\electron-renderer\dist" rmdir /s /q "packages\frontend\apps\electron-renderer\dist" 2>nul
if exist "packages\frontend\apps\electron\out" rmdir /s /q "packages\frontend\apps\electron\out" 2>nul
echo     Done!
echo.

echo [2/6] Installing dependencies...
echo.
call yarn install
if errorlevel 1 (
    echo ERROR: yarn install failed!
    pause
    exit /b 1
)
echo     Done!
echo.

echo [3/6] Building electron-renderer...
echo.
call yarn yunke bundle --package @yunke/electron-renderer
if errorlevel 1 (
    echo ERROR: electron-renderer build failed!
    pause
    exit /b 1
)
echo     Done!
echo.

echo [4/6] Building electron main process...
echo.
cd packages\frontend\apps\electron
call yarn build
if errorlevel 1 (
    echo ERROR: electron build failed!
    cd /d %~dp0
    pause
    exit /b 1
)
cd /d %~dp0
echo     Done!
echo.

echo [5/6] Packaging Electron app (electron-forge)...
echo.
cd packages\frontend\apps\electron
call yarn package
if errorlevel 1 (
    echo ERROR: electron-forge package failed!
    cd /d %~dp0
    pause
    exit /b 1
)
cd /d %~dp0
echo     Done!
echo.

echo [6/6] Creating Windows installer (NSIS)...
echo      Note: Using NSIS instead of Squirrel for Chinese filename support
echo.
cd packages\frontend\apps\electron
call yarn make-nsis
if errorlevel 1 (
    echo ERROR: make-nsis failed!
    cd /d %~dp0
    pause
    exit /b 1
)
cd /d %~dp0
echo     Done!
echo.

echo ========================================
echo   SUCCESS! Build completed!
echo ========================================
echo.
echo Installer: packages\frontend\apps\electron\out\canary\make\nsis.windows\x64
echo.
pause

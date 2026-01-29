@echo off
echo ========================================
echo   YUNKE Desktop - Development Mode
echo ========================================
echo.

cd /d %~dp0

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo     Installing dependencies...
    call yarn install
)
echo     Done!
echo.

echo [2/3] Starting renderer dev server (http://localhost:8080)
echo.
start "Electron Renderer" cmd /k "cd /d %~dp0packages\frontend\apps\electron-renderer && yarn dev"

echo ========================================
echo   Wait for localhost:8080 to start...
echo   Then press any key to continue
echo ========================================
pause

echo.
echo [3/3] Starting Electron main process...
echo.
start "Electron Main" cmd /k "cd /d %~dp0packages\frontend\apps\electron && yarn dev"

echo.
echo ========================================
echo   Development environment started!
echo ========================================
echo.
echo Two windows opened:
echo   - Electron Renderer: Dev server
echo   - Electron Main: Electron process
echo.
echo Debug: Press F12 in Electron window
echo.

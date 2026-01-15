@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
pushd "%ROOT%"

set "BUILD_TYPE=stable"
set "SKIP_WEB_BUILD="

set "ENV_LOCAL=.env.local"
set "ENV_BACKUP=.env.local.bak.offline"

if exist "%ENV_BACKUP%" del "%ENV_BACKUP%"
if exist "%ENV_LOCAL%" (
  ren "%ENV_LOCAL%" ".env.local.bak.offline"
)

> "%ENV_LOCAL%" (
  echo VITE_API_BASE_URL=
  echo VITE_SOCKETIO_URL=
  echo VITE_SOCKETIO_PORT=
)

set "FAILED=0"

echo [1/3] build @yunke/config

call yarn workspace @yunke/config build
if errorlevel 1 set "FAILED=1" & goto :restore

echo [2/3] build @yunke/electron
set BUILD_TYPE=%BUILD_TYPE%
call yarn workspace @yunke/electron build
if errorlevel 1 set "FAILED=1" & goto :restore

echo [3/3] make @yunke/electron
call yarn workspace @yunke/electron make
if errorlevel 1 set "FAILED=1" & goto :restore

:restore
if exist "%ENV_LOCAL%" del "%ENV_LOCAL%"
if exist "%ENV_BACKUP%" ren "%ENV_BACKUP%" ".env.local"

popd

if "%FAILED%"=="1" (
  echo.
  echo Build failed. The window will stay open.
  echo Please scroll up to see the error log.
  pause
  exit /b 1
)

set "ZIP="
for /f "delims=" %%F in ('dir /b /s "%ROOT%packages\frontend\apps\electron\out\%BUILD_TYPE%\make\zip\win32\x64\*.zip" 2^>nul') do (
  set "ZIP=%%F"
  goto :unzip
)

:unzip
if defined ZIP (
  set "UNZIP_DIR=%TEMP%\yunke-offline-%BUILD_TYPE%"
  if exist "%UNZIP_DIR%" rmdir /s /q "%UNZIP_DIR%"
  powershell -NoProfile -Command "Expand-Archive -Force '%ZIP%' '%UNZIP_DIR%'" >nul 2>&1
  set "APP_EXE="
  for /f "delims=" %%E in ('dir /b /s "%UNZIP_DIR%\YUNKE*.exe" 2^>nul') do (
    set "APP_EXE=%%E"
    goto :launch
  )
)

set "SETUP="
for /f "delims=" %%F in ('dir /b /s "%ROOT%packages\frontend\apps\electron\out\%BUILD_TYPE%\make\squirrel.windows\x64\* Setup.exe" 2^>nul') do (
  set "SETUP=%%F"
  goto :launch
)

echo No runnable exe found.
echo Zip path: %ZIP%
echo Setup path: %ROOT%packages\frontend\apps\electron\out\%BUILD_TYPE%\make\squirrel.windows\x64\
exit /b 1

:launch
if defined APP_EXE (
  start "" "%APP_EXE%"
  exit /b 0
)
start "" "%SETUP%"
exit /b 0

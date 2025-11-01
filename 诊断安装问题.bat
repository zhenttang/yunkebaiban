@echo off
chcp 65001 >nul
echo.
echo ============================================
echo 安装包诊断工具
echo ============================================
echo.

set INSTALLER_PATH=packages\frontend\apps\electron\out\make\squirrel.windows\x64\YUNKE-canary-0.21.0 Setup.exe

echo 检查安装包文件...
if exist "%INSTALLER_PATH%" (
    echo [OK] 找到安装程序: %INSTALLER_PATH%
    for %%A in ("%INSTALLER_PATH%") do echo     文件大小: %%~zA 字节
) else (
    echo [ERROR] 找不到安装程序！
    echo 请确认路径: %INSTALLER_PATH%
    pause
    exit /b 1
)

echo.
echo 检查 .NET Framework...
reg query "HKLM\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" /v Release >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未安装 .NET Framework 4.5+
    echo.
    echo 解决方案：
    echo 1. 访问：https://dotnet.microsoft.com/download/dotnet-framework
    echo 2. 下载并安装 .NET Framework 4.8
    echo 3. 重启电脑后重试
) else (
    echo [OK] 已安装 .NET Framework
)

echo.
echo 检查 Windows 版本...
ver
echo.

echo ============================================
echo 诊断完成
echo ============================================
echo.
echo 尝试以管理员身份运行安装程序：
echo 1. 找到文件: %INSTALLER_PATH%
echo 2. 右键点击 "YUNKE-canary Setup.exe"
echo 3. 选择"以管理员身份运行"
echo.
echo 如果还是闪退，请查看 Windows 事件日志：
echo 1. Win + X 打开菜单
echo 2. 选择"事件查看器"
echo 3. 查看"Windows 日志" - "应用程序"
echo 4. 找到最近的错误信息
echo.
pause


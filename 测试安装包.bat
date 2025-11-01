@echo off
chcp 65001 >nul
echo.
echo ============================================
echo 测试安装包（调试模式）
echo ============================================
echo.

cd packages\frontend\apps\electron\out\make\squirrel.windows\x64

echo 当前目录：
cd
echo.

echo 文件列表：
dir /b
echo.

echo 尝试运行安装程序（带日志）...
echo 如果闪退，请截图或复制错误信息
echo.
pause

echo 开始安装...
"YUNKE-canary-0.21.0 Setup.exe" --squirrel-firstrun

echo.
echo 安装程序已退出
echo 退出代码: %errorlevel%
echo.

if errorlevel 1 (
    echo [ERROR] 安装失败，错误代码: %errorlevel%
) else (
    echo [OK] 安装成功
)

echo.
pause


@echo off
echo Building Android APK with Docker...

docker run --rm ^
  -v "%cd%\App:/project" ^
  -v "%cd%\..\..\..\..\..\node_modules:/node_modules:ro" ^
  -w /project ^
  cimg/android:2024.11-ndk ^
  bash -c "export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 && chmod +x gradlew && ./gradlew assembleStableRelease"

echo.
echo Build complete! APK location:
echo %cd%\App\app\build\outputs\apk\stable\release\
pause

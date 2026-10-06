@echo off
cd /d "%~dp0"
echo ================================================
echo    CPU PERFORMANCE ANALYZER
echo    Starting Frontend + Backend together
echo ================================================
echo.
if not exist "backend\.venv\Scripts\python.exe" (
  echo First-time setup required...
  npm run setup
  if errorlevel 1 pause & exit /b 1
)
npm run dev
pause

@echo off
chcp 65001 >nul
title وصلة - نظام إدارة الشبكات

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    وصلة - نظام إدارة الشبكات                 ║
echo ║                      جاري تشغيل النظام...                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo [1/3] جاري تشغيل الخادم...
cd server
start /b cmd /c "npm start"
cd ..

:: Wait for server to start
timeout /t 3 /nobreak >nul

echo [2/3] جاري تشغيل الواجهة...
start /b cmd /c "npm run dev -- --host"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

echo [3/3] جاري فتح المتصفح...
start http://localhost:5173

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                     ✅ النظام يعمل الآن!                     ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║   🖥️  من اللابتوب: http://localhost:5173                     ║
echo ║   📱  من الجوال:   http://%IP%:5173                  ║
echo ║                                                              ║
echo ║   ⚙️  الخادم:       http://%IP%:3001                  ║
echo ║                                                              ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║          لا تغلق هذه النافذة أثناء استخدام النظام!           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo اضغط أي مفتاح للإيقاف...
pause >nul

:: Kill processes
taskkill /f /im node.exe >nul 2>&1
echo تم إيقاف النظام.

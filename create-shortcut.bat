@echo off
chcp 65001 >nul

:: Get current directory
set SCRIPT_DIR=%~dp0
set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

:: Create VBS script to make shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\وصلة - نظام الشبكات.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%SCRIPT_DIR%\start-windows.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "تشغيل نظام وصلة لإدارة الشبكات" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.IconLocation = "%SystemRoot%\System32\SHELL32.dll,14" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

:: Run VBS script
cscript //nologo "%TEMP%\CreateShortcut.vbs"

:: Clean up
del "%TEMP%\CreateShortcut.vbs"

echo.
echo ========================================
echo   تم إنشاء الاختصار على سطح المكتب!
echo ========================================
echo.
echo يمكنك الان تشغيل النظام من سطح المكتب
echo.
pause

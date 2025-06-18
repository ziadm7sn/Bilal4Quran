@echo off
title فحص المتطلبات - البحث في القرآن الكريم
color 0B
echo ===============================================
echo         فحص المتطلبات المسبقة
echo ===============================================
echo.

echo [1] فحص Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Python متاح
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo    الإصدار: %%i
    echo    المسار: 
    where python 2>nul
) else (
    echo [✗] Python غير متاح
)
echo.

echo [2] فحص Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Node.js متاح
    for /f "tokens=1" %%i in ('node --version 2^>^&1') do echo    الإصدار: %%i
    echo    المسار:
    where node 2>nul
) else (
    echo [✗] Node.js غير متاح
)
echo.

echo [3] فحص الملفات المطلوبة...
if exist "index.html" (
    echo [✓] index.html موجود
) else (
    echo [✗] index.html مفقود
)

if exist "orthographic_v1.0.csv" (
    echo [✓] orthographic_v1.0.csv موجود
    for %%A in (orthographic_v1.0.csv) do echo    الحجم: %%~zA بايت
) else (
    echo [✗] orthographic_v1.0.csv مفقود
)
echo.

echo [4] فحص المنفذ 8000...
netstat -an | find ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [تحذير] المنفذ 8000 مستخدم بالفعل
    echo قد تحتاج لإيقاف الخدمة الأخرى أو استخدام منفذ آخر
) else (
    echo [✓] المنفذ 8000 متاح
)
echo.

echo ===============================================
echo                النتيجة النهائية
echo ===============================================

REM تحديد الحالة العامة
set "python_ok=false"
set "node_ok=false"
set "files_ok=false"

python --version >nul 2>&1
if %errorlevel% equ 0 set "python_ok=true"

node --version >nul 2>&1
if %errorlevel% equ 0 set "node_ok=true"

if exist "index.html" set "files_ok=true"

if "%python_ok%"=="true" (
    echo [✓] يمكنك استخدام Python لتشغيل الخادم
    echo     شغل: start-server.bat
) else if "%node_ok%"=="true" (
    echo [✓] يمكنك استخدام Node.js لتشغيل الخادم
    echo     شغل: start-server.bat
) else (
    echo [✗] تحتاج لتثبيت Python أو Node.js أولاً
    echo.
    echo روابط التحميل:
    echo Python: https://python.org/downloads
    echo Node.js: https://nodejs.org
)

if "%files_ok%"=="false" (
    echo [✗] تأكد من وجود ملف index.html في نفس المجلد
)

echo.
echo ===============================================
pause

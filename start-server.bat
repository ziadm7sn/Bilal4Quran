@echo off
title خادم البحث في القرآن الكريم
color 0A
echo ===============================================
echo       خادم البحث في القرآن الكريم
echo ===============================================
echo.

REM التحقق من وجود الملفات المطلوبة
if not exist "index.html" (
    echo [خطأ] ملف index.html غير موجود!
    echo تأكد من تشغيل هذا الملف في نفس مجلد المشروع
    pause
    exit /b 1
)

if not exist "orthographic_v1.0.csv" (
    echo [تحذير] ملف orthographic_v1.0.csv غير موجود!
    echo سيتم استخدام البيانات المضمنة المحدودة
    echo.
)

echo [معلومات] التحقق من البرامج المتاحة...
echo.

REM التحقق من Python 3
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] تم العثور على Python
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo    الإصدار: %%i
    echo.
    echo [بدء] تشغيل خادم Python على المنفذ 8000...
    echo [معلومات] افتح المتصفح وانتقل إلى: http://localhost:8000
    echo [معلومات] اضغط Ctrl+C لإيقاف الخادم
    echo.
    echo ===============================================
    python -m http.server 8000
    goto :end
)

REM التحقق من Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] تم العثور على Node.js
    for /f "tokens=1" %%i in ('node --version 2^>^&1') do echo    الإصدار: %%i
    echo.
    echo [بدء] تشغيل خادم Node.js على المنفذ 8000...
    echo [معلومات] افتح المتصفح وانتقل إلى: http://localhost:8000
    echo [معلومات] اضغط Ctrl+C لإيقاف الخادم
    echo.
    echo ===============================================
    npx http-server -p 8000 -c-1
    goto :end
)

REM إذا لم يتم العثور على أي برنامج
echo [خطأ] لم يتم العثور على Python أو Node.js!
echo.
echo يرجى تثبيت أحد البرامج التالية:
echo.
echo 1. Python (الأسهل):
echo    - انتقل إلى: https://python.org/downloads
echo    - حمل وثبت أحدث إصدار
echo    - تأكد من تحديد "Add Python to PATH" أثناء التثبيت
echo.
echo 2. Node.js:
echo    - انتقل إلى: https://nodejs.org
echo    - حمل وثبت النسخة LTS
echo.
echo 3. استخدم VS Code مع إضافة Live Server
echo.
echo بعد التثبيت، أعد تشغيل هذا الملف
echo.

:end
echo.
echo ===============================================
echo شكراً لاستخدام البحث في القرآن الكريم
echo ===============================================
pause

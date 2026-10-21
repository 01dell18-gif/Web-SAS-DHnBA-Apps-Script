@echo off
chcp 65001 >nul
title "Generator Absensi dan Berita Acara SAS - SMK NEGERI FYJ CHANNEL"
cd /d "%~dp0"

echo =========================================================
echo   GENERATOR ABSENSI ^& BERITA ACARA UJIAN SAS
echo   SMK NEGERI FYJ CHANNEL
echo =========================================================
echo.

:: 1. Periksa apakah Node.js sudah terpasang
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstall di komputer ini!
    echo Silakan unduh dan install Node.js terlebih dahulu di:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Periksa apakah server sudah aktif di port 3003
netstat -ano | findstr :3003 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Server sudah aktif berjalan.
) else (
    echo [INFO] Menjalankan server aplikasi...
    start "Server SAS FYJ (Port 3003)" cmd /k "node server.js"
    echo [INFO] Menunggu server siap...
    ping 127.0.0.1 -n 3 >nul
)

:: 3. Buka browser secara otomatis ke halaman web
echo [INFO] Membuka web di browser...
start http://localhost:3003

echo.
echo =========================================================
echo   Aplikasi berhasil dibuka!
echo.
echo   - Beranda Siswa / Cetak : http://localhost:3003
echo   - Panel Admin           : http://localhost:3003/admin/login.html
echo.
echo   Jendela ini akan tertutup otomatis.
echo   (Server tetap berjalan di latar belakang).
echo =========================================================
echo.

ping 127.0.0.1 -n 4 >nul
exit

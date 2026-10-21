@echo off
chcp 65001 >nul
title "Menghentikan Server SAS - SMK NEGERI FYJ CHANNEL"
cd /d "%~dp0"

echo =========================================================
echo   MENGHENTIKAN SERVER SAS (PORT 3003)
echo =========================================================
echo.

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003 ^| findstr LISTENING') do (
    set PID=%%a
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo [INFO] Ditemukan proses server dengan PID %PID%.
    echo [INFO] Menghentikan proses...
    taskkill /F /PID %PID% >nul 2>&1
    echo [SUKSES] Server di port 3003 telah berhasil dihentikan.
) else (
    echo [INFO] Tidak ada server yang sedang berjalan di port 3003.
)

echo.
pause

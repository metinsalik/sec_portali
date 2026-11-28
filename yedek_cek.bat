@echo off
chcp 65001 >nul
setlocal

:: ==========================================================
::  SEC PORTALI - CANLI SUNUCUDAN YEDEK CEKME ARACI
::  Kaynak: \\10.234.2.101\backups (Sabit Sunucu IP)
::  Hedef:  C:\Users\metin.salik\OneDrive - mlpcare.com\Belgeler\SEC_Portali_Backup
:: ==========================================================

set "SOURCE_DIR=\\10.234.2.101\backups"
set "ALT_SOURCE_DIR=\\10.234.2.101\C$\Users\Administrator\Desktop\sec_portali-main\backups"
set "TARGET_DIR=C:\Users\metin.salik\OneDrive - mlpcare.com\Belgeler\SEC_Portali_Backup"

:: Hangi paylasim aciksa onu sec
if not exist "%SOURCE_DIR%\db_latest.sql.gz" (
    if exist "%ALT_SOURCE_DIR%\db_latest.sql.gz" (
        set "SOURCE_DIR=%ALT_SOURCE_DIR%"
    )
)

echo ==========================================================
echo  SEC PORTALI - YEDEK CEKME BASLATILDI (%date% %time%)
echo  Kaynak: %SOURCE_DIR%
echo  Hedef:  %TARGET_DIR%
echo ==========================================================
echo.

:: Sunucu paylasimina erisim kontrolu
if not exist "%SOURCE_DIR%\db_latest.sql.gz" (
    echo HATA: Sunucu yedek klasorune erisilemiyor: %SOURCE_DIR%
    echo VPN baglantinizi veya sunucu erisimini kontrol edin.
    if /I not "%1"=="--silent" pause
    exit /b 1
)

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

:: 1. Veritabani yedegini canli % ilerleme ile kopyala (robocopy: 0-7 basarili, 8+ hata)
echo [1/2] Veritabani yedegi indiriliyor (db_latest.sql.gz)...
robocopy "%SOURCE_DIR%" "%TARGET_DIR%" "db_latest.sql.gz" /Z /R:2 /W:3 /NJH /NJS /NDL /IS /IT
if errorlevel 8 (
    echo HATA: db_latest.sql.gz indirilemedi!
    if /I not "%1"=="--silent" pause
    exit /b 1
)
echo.

:: 2. Uploads (fotograflar/belgeler) yedegini canli % ilerleme ile kopyala
if exist "%SOURCE_DIR%\uploads_latest.tar.gz" (
    echo [2/2] Fotograflar ve belgeler indiriliyor ^(uploads_latest.tar.gz^)...
    robocopy "%SOURCE_DIR%" "%TARGET_DIR%" "uploads_latest.tar.gz" /Z /R:2 /W:3 /NJH /NJS /NDL /IS /IT
    if errorlevel 8 (
        echo HATA: uploads_latest.tar.gz indirilemedi!
        if /I not "%1"=="--silent" pause
        exit /b 1
    )
) else (
    echo [2/2] uploads_latest.tar.gz bulunamadi, atlandi.
)

echo.
echo ==========================================================
echo  BASARILI: Guncel yedekler OneDrive klasorune kaydedildi!
echo  Konum: %TARGET_DIR%
echo ==========================================================
dir /-c "%TARGET_DIR%\*_latest.*" | findstr /I "_latest"
echo.
if /I not "%1"=="--silent" pause

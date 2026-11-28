@echo off
chcp 65001 >nul
setlocal

echo ========================================================
echo  SEC Portali - GitHub Gonderim Araci
echo ========================================================
echo.

echo [1/4] Degistirilen tum dosyalar ekleniyor (.gitignore haric)...
git add -A
if errorlevel 1 (
    echo HATA: Dosyalar eklenirken bir sorun olustu.
    pause
    exit /b 1
)

echo.
echo [2/4] Gonderilecek dosyalarin ozeti:
git --no-pager diff --cached --stat
echo.

echo [3/4] Commit olusturuluyor...
git --no-pager diff --cached --quiet
if errorlevel 1 (
    git commit -m "feat: Outlook EML taslagi, CID gorselli HTML sablonlar, giris sonrasi yonlendirme ve ISG Defteri UI/UX yenilemesi"
    if errorlevel 1 (
        echo HATA: Commit olusturulamadi.
        pause
        exit /b 1
    )
) else (
    echo Yeni degisiklik yok, mevcut commitler gonderilecek.
)

echo.
echo [4/4] GitHub'a gonderiliyor - origin main...
git push origin main
if errorlevel 1 (
    echo.
    echo HATA: GitHub'a gonderim basarisiz oldu.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo  TAMAMLANDI - Guncellemeler GitHub'a basariyla gonderildi!
echo ========================================================
pause

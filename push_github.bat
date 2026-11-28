@echo off
chcp 65001 >nul
setlocal

echo ========================================================
echo  SEC Portali - GitHub Gonderim Araci
echo ========================================================
echo.

echo [1/4] Degistirilen dosyalar ekleniyor...
git add Install-guide.md
git add backend/Dockerfile
git add backend/prisma/schema.prisma
git add backend/src/services/auditImprovementSync.ts
git add backend/src/routes/renovation_report.ts
git add backend/src/routes/improvements/index.ts
git add apps/web/src/pages/build_management/types.ts
git add apps/web/src/pages/build_management/services/auditApi.ts
git add apps/web/src/pages/build_management/components/AuditActionStepDialog.tsx
git add apps/web/src/pages/build_management/views/AuditWorkspace.tsx
git add apps/web/src/pages/build_management/views/PublishedReportDetailPage.tsx
git add apps/web/src/pages/build_management/views/AuditFindingDetailPage.tsx
git add apps/web/src/pages/build_management/views/ReportTemplate.tsx
git add apps/web/src/pages/operations/improvements/types.ts
git add apps/web/src/pages/operations/improvements/DenetimlerPage.tsx
git add apps/web/src/pages/operations/improvements/ImprovementTable.tsx
git add apps/web/src/pages/operations/improvements/ImprovementRecordDialogs.tsx
git add apps/web/src/pages/hazmat/MaterialsListPage.tsx
git add apps/web/src/pages/hazmat/MaterialFormPage.tsx
git add apps/web/src/pages/hazmat/MaterialViewPage.tsx
git add apps/web/src/components/hazmat/PrintCardModal.tsx
git add apps/web/src/components/hazmat/MaterialPrintCard.tsx
git add apps/web/src/pages/settings/DefinitionsPage.tsx
git add apps/web/src/components/shared/LocationCascadingSelector.tsx
git add apps/web/src/pages/ProfilePage.tsx
git add apps/web/src/context/AuthContext.tsx
git add backend/src/routes/auth.ts
git add backend/src/routes/hazmat/materials.ts
git add backend/src/scripts/standardizeDepartments.ts
git add backend/src/services/mail.ts
git add backend/src/routes/settings.ts
git add apps/web/src/pages/settings/SmtpSettingsPage.tsx
git add apps/web/src/pages/settings/EmailTemplatesPage.tsx
git add apps/web/src/pages/operations/improvements/ImprovementDetailPage.tsx
git add apps/web/src/components/ProtectedRoute.tsx
git add apps/web/src/pages/Login.tsx
git add apps/web/src/context/AuthContext.tsx
git add push_github.bat
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
    git commit -m "feat: Outlook EML taslagi, CID gorselli HTML sablonlar, departman sorumlulari ve giris sonrasi yonlendirme"
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

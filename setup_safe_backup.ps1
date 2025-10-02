# دليل التنفيذ السريع للتوصيات الفورية
# Quick Implementation Guide

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   تفعيل نظام النسخ الاحتياطي الآمن" -ForegroundColor Yellow
Write-Host "   Safe Backup System Activation" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$rootPath = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
Set-Location $rootPath

# ==========================================
# 1. حماية classroom.db من Git
# ==========================================
Write-Host "[1/5] حماية قواعد البيانات من Git..." -ForegroundColor Green

$gitignorePath = Join-Path $rootPath ".gitignore"
$gitignoreContent = @"

# قواعد البيانات المحلية - Local databases
classroom.db
classroom_*.db
backups/
auto_backups/
*.db-journal
*.db-shm
*.db-wal

"@

if (Test-Path $gitignorePath) {
    $existing = Get-Content $gitignorePath -Raw
    if ($existing -notmatch "classroom\.db") {
        Add-Content -Path $gitignorePath -Value $gitignoreContent
        Write-Host "   ✅ تم إضافة القواعد إلى .gitignore" -ForegroundColor Green
    } else {
        Write-Host "   ✓ القواعد موجودة بالفعل في .gitignore" -ForegroundColor Gray
    }
} else {
    Set-Content -Path $gitignorePath -Value $gitignoreContent
    Write-Host "   ✅ تم إنشاء .gitignore جديد" -ForegroundColor Green
}

# ==========================================
# 2. تحديث package.json لربط prestart-backup
# ==========================================
Write-Host "`n[2/5] تحديث سكريبتات التشغيل..." -ForegroundColor Green

$packageJsonPath = Join-Path $rootPath "backend\package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    # تحديث السكريبتات
    $packageJson.scripts | Add-Member -MemberType NoteProperty -Name "start" -Value "node ./scripts/prestart_backup.js && node index.js" -Force
    $packageJson.scripts | Add-Member -MemberType NoteProperty -Name "dev" -Value "node ./scripts/prestart_backup.js && nodemon index.js" -Force
    
    # حفظ التغييرات
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
    Write-Host "   ✅ تم تحديث package.json بنجاح" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ لم يتم العثور على package.json" -ForegroundColor Yellow
}

# ==========================================
# 3. إنشاء سكريبت تشغيل خدمة النسخ
# ==========================================
Write-Host "`n[3/5] إنشاء سكريبت تشغيل خدمة النسخ..." -ForegroundColor Green

$startBackupScript = @"
# تشغيل خدمة النسخ الاحتياطية التلقائية
# Start Automated Backup Service

`$scriptPath = Join-Path `$PSScriptRoot "smart_backup_service.cjs"

Write-Host "🚀 تشغيل خدمة النسخ الاحتياطية الذكية..." -ForegroundColor Cyan

# التحقق من وجود node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js غير مثبت أو غير موجود في PATH" -ForegroundColor Red
    exit 1
}

# تشغيل الخدمة في خلفية PowerShell
`$job = Start-Job -ScriptBlock {
    param(`$path)
    Set-Location (Split-Path `$path)
    node `$path
} -ArgumentList `$scriptPath

Write-Host "✅ تم تشغيل الخدمة (Job ID: `$(`$job.Id))" -ForegroundColor Green
Write-Host "📊 لعرض حالة الخدمة: Get-Job -Id `$(`$job.Id)" -ForegroundColor Cyan
Write-Host "📋 لعرض المخرجات: Receive-Job -Id `$(`$job.Id) -Keep" -ForegroundColor Cyan
Write-Host "🛑 لإيقاف الخدمة: Stop-Job -Id `$(`$job.Id); Remove-Job -Id `$(`$job.Id)" -ForegroundColor Yellow

# حفظ معلومات Job للرجوع إليها
`$jobInfo = @{
    JobId = `$job.Id
    StartTime = Get-Date
    ScriptPath = `$scriptPath
} | ConvertTo-Json

`$jobInfo | Out-File (Join-Path `$PSScriptRoot "backup_service_job.json")
Write-Host "`n💾 تم حفظ معلومات الخدمة في backup_service_job.json" -ForegroundColor Green

return `$job
"@

$startBackupPath = Join-Path $rootPath "start_backup_service.ps1"
Set-Content -Path $startBackupPath -Value $startBackupScript
Write-Host "   ✅ تم إنشاء start_backup_service.ps1" -ForegroundColor Green

# ==========================================
# 4. إنشاء نسخة احتياطية فورية
# ==========================================
Write-Host "`n[4/5] إنشاء نسخة احتياطية فورية..." -ForegroundColor Green

$backupScriptPath = Join-Path $rootPath "backend\scripts\prestart_backup.js"
if (Test-Path $backupScriptPath) {
    try {
        node $backupScriptPath
        Write-Host "   ✅ تم إنشاء نسخة احتياطية فورية" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ خطأ في إنشاء النسخة: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️ سكريبت prestart_backup.js غير موجود" -ForegroundColor Yellow
}

# ==========================================
# 5. عرض التقرير النهائي
# ==========================================
Write-Host "`n[5/5] التقرير النهائي..." -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ اكتمل الإعداد بنجاح!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 ما تم إنجازه:" -ForegroundColor Yellow
Write-Host "   ✅ حماية قواعد البيانات من Git" -ForegroundColor White
Write-Host "   ✅ ربط prestart-backup بسكريبتات التشغيل" -ForegroundColor White
Write-Host "   ✅ إنشاء سكريبت تشغيل خدمة النسخ" -ForegroundColor White
Write-Host "   ✅ إنشاء نسخة احتياطية فورية" -ForegroundColor White

Write-Host "`n🚀 الخطوات التالية:" -ForegroundColor Yellow
Write-Host "   1. لتشغيل خدمة النسخ التلقائية:" -ForegroundColor Cyan
Write-Host "      .\start_backup_service.ps1" -ForegroundColor White
Write-Host ""
Write-Host "   2. لتشغيل الخادم (مع نسخة احتياطية تلقائية):" -ForegroundColor Cyan
Write-Host "      cd backend" -ForegroundColor White
Write-Host "      npm start" -ForegroundColor White
Write-Host ""
Write-Host "   3. لعمل استعادة آمنة:" -ForegroundColor Cyan
Write-Host "      cd backend" -ForegroundColor White
Write-Host "      npm run safe-restore --force --source ../path/to/backup.db" -ForegroundColor White

Write-Host "`n📊 للمزيد من التفاصيل، راجع:" -ForegroundColor Yellow
Write-Host "   BACKUP_SYSTEM_REPORT.md" -ForegroundColor White

Write-Host "`n========================================`n" -ForegroundColor Cyan

#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// خدمة مراقبة النسخ الاحتياطي
class BackupMonitor {
    constructor() {
        this.backupDir = './automated_backups';
        this.lastBackup = null;
        this.isServiceRunning = false;
        
        console.log('🔍 خدمة مراقبة النسخ الاحتياطي بدأت...');
        this.init();
    }

    async init() {
        // التحقق من وجود مجلد النسخ الاحتياطي
        if (fs.existsSync(this.backupDir)) {
            this.checkLastBackup();
            this.isServiceRunning = true;
        }
        
        // مراقبة مستمرة كل 30 ثانية
        setInterval(() => {
            this.checkLastBackup();
        }, 30000);
    }

    checkLastBackup() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                this.lastBackup = null;
                return;
            }

            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('auto_backup_'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    stat: fs.statSync(path.join(this.backupDir, file))
                }))
                .sort((a, b) => b.stat.mtime - a.stat.mtime);

            if (files.length > 0) {
                this.lastBackup = {
                    name: files[0].name,
                    date: files[0].stat.mtime,
                    size: this.formatFileSize(files[0].stat.size || 0)
                };
            }
        } catch (error) {
            console.error('❌ خطأ في فحص النسخ الاحتياطية:', error.message);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getStatus() {
        const now = new Date();
        let status = 'inactive';
        let message = 'غير نشط';

        if (this.isServiceRunning && this.lastBackup) {
            const timeDiff = now - new Date(this.lastBackup.date);
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff < 8) {
                status = 'active';
                message = 'نشط - آخر نسخة منذ ' + Math.floor(hoursDiff) + ' ساعة';
            } else {
                status = 'warning';
                message = 'تحذير - آخر نسخة منذ ' + Math.floor(hoursDiff) + ' ساعة';
            }
        }

        return {
            status,
            message,
            lastBackup: this.lastBackup,
            isServiceRunning: this.isServiceRunning,
            timestamp: now.toISOString()
        };
    }
}

// إنشاء مثيل من المراقب
const monitor = new BackupMonitor();

// API endpoints
app.get('/api/backup/status', (req, res) => {
    res.json(monitor.getStatus());
});

app.get('/api/backup/health', (req, res) => {
    res.json({
        service: 'backup-monitor',
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// بدء الخادم
app.listen(PORT, () => {
    console.log(`🚀 خدمة مراقبة النسخ الاحتياطي تعمل على البورت ${PORT}`);
    console.log(`📡 API متاح على: http://localhost:${PORT}/api/backup/status`);
});

// التعامل مع إغلاق التطبيق
process.on('SIGINT', () => {
    console.log('\n⏹️  إيقاف خدمة مراقبة النسخ الاحتياطي...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  إيقاف خدمة مراقبة النسخ الاحتياطي...');
    process.exit(0);
});
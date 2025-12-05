#!/usr/bin/env node
/**
 * مولد المخطط الأمني التفاعلي المباشر
 * Live Interactive Security Diagram Generator
 * يقوم بقراءة حالة النظام الفعلية وإنشاء مخطط تفاعلي محدث
 */

const fs = require('fs');
const path = require('path');

class LiveSecurityDiagramGenerator {
    constructor() {
        this.systemData = {
            backups: [],
            scripts: [],
            logs: [],
            alerts: [],
            currentStatus: {},
            lastUpdate: new Date().toISOString()
        };
        
        this.colors = {
            safe: '#4ade80',      // أخضر - آمن
            warning: '#fbbf24',   // أصفر - تحذير
            danger: '#ef4444',    // أحمر - خطر
            info: '#3b82f6',      // أزرق - معلومات
            neutral: '#6b7280'    // رمادي - حيادي
        };
    }

    /**
     * جمع البيانات الحية من النظام
     */
    async collectLiveData() {
        console.log('📊 جمع البيانات الحية من النظام...');
        
        // جمع بيانات النسخ الاحتياطية
        await this.collectBackupData();
        
        // جمع بيانات السكريبتات
        await this.collectScriptData();
        
        // جمع بيانات اللوقات الأمنية
        await this.collectSecurityLogs();
        
        // جمع بيانات الإنذارات
        await this.collectAlerts();
        
        // تحديد الحالة العامة
        this.calculateSystemStatus();
        
        console.log('✅ تم جمع البيانات الحية بنجاح');
    }

    /**
     * جمع بيانات النسخ الاحتياطية
     */
    async collectBackupData() {
        const backupDirs = ['./security_backups', './automated_backups', './emergency_environment_backups'];
        this.systemData.backups = [];
        
        for (const dir of backupDirs) {
            if (fs.existsSync(dir)) {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const itemPath = path.join(dir, item);
                    const stats = fs.statSync(itemPath);
                    
                    if (stats.isDirectory() && (
                        item.includes('backup') || 
                        item.includes('comprehensive') || 
                        item.includes('auto_backup')
                    )) {
                        const age = (Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60); // ساعات
                        
                        this.systemData.backups.push({
                            name: item,
                            path: itemPath,
                            age: age,
                            size: this.calculateDirectorySize(itemPath),
                            type: this.determineBackupType(item),
                            status: age < 24 ? 'fresh' : age < 168 ? 'good' : 'old'
                        });
                    }
                }
            }
        }
        
        // ترتيب حسب الأحدث
        this.systemData.backups.sort((a, b) => a.age - b.age);
    }

    /**
     * جمع بيانات السكريبتات
     */
    async collectScriptData() {
        const dangerousScripts = [
            { name: 'reset_db.js', path: 'backend/reset_db.js', danger: 'CRITICAL' },
            { name: 'manual_migration.js', path: 'backend/manual_migration.js', danger: 'HIGH' },
            { name: 'repair_student_sections.js', path: 'backend/repair_student_sections.js', danger: 'HIGH' },
            { name: 'restore_schedule.js', path: 'backend/restore_schedule.js', danger: 'MEDIUM' },
            { name: 'fix_schedule_days.js', path: 'backend/fix_schedule_days.js', danger: 'MEDIUM' }
        ];
        
        this.systemData.scripts = [];
        
        for (const script of dangerousScripts) {
            if (fs.existsSync(script.path)) {
                const content = fs.readFileSync(script.path, 'utf-8');
                const stats = fs.statSync(script.path);
                
                // فحص مستوى الحماية
                const protectionLevel = this.analyzeScriptProtection(content);
                
                this.systemData.scripts.push({
                    name: script.name,
                    path: script.path,
                    danger: script.danger,
                    protection: protectionLevel,
                    lastModified: stats.mtime,
                    size: stats.size,
                    status: this.getScriptStatus(script.danger, protectionLevel)
                });
            }
        }
    }

    /**
     * جمع بيانات اللوقات الأمنية
     */
    async collectSecurityLogs() {
        const logFiles = [
            { name: 'security_audit.log', type: 'security' },
            { name: 'backup_service.log', type: 'backup' },
            { name: 'recovery_audit.log', type: 'recovery' }
        ];
        
        this.systemData.logs = [];
        
        for (const logFile of logFiles) {
            if (fs.existsSync(logFile.name)) {
                const content = fs.readFileSync(logFile.name, 'utf-8');
                const lines = content.trim().split('\n').filter(line => line);
                const stats = fs.statSync(logFile.name);
                
                // تحليل آخر الأحداث
                const recentEvents = this.analyzeRecentEvents(lines, logFile.type);
                
                this.systemData.logs.push({
                    name: logFile.name,
                    type: logFile.type,
                    totalEvents: lines.length,
                    recentEvents: recentEvents,
                    lastUpdate: stats.mtime,
                    size: stats.size
                });
            }
        }
    }

    /**
     * جمع بيانات الإنذارات
     */
    async collectAlerts() {
        this.systemData.alerts = [];
        
        if (fs.existsSync('security_alerts.log')) {
            const content = fs.readFileSync('security_alerts.log', 'utf-8');
            const lines = content.trim().split('\n').filter(line => line);
            
            for (const line of lines) {
                try {
                    const alert = JSON.parse(line);
                    const age = (Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 60 * 60);
                    
                    if (age < 24) { // إنذارات آخر 24 ساعة فقط
                        this.systemData.alerts.push({
                            ...alert,
                            age: age
                        });
                    }
                } catch (error) {
                    // تجاهل الأسطر المعطوبة
                }
            }
        }
    }

    /**
     * حساب حجم المجلد
     */
    calculateDirectorySize(dirPath) {
        let totalSize = 0;
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    totalSize += this.calculateDirectorySize(itemPath);
                } else {
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            // تجاهل الأخطاء
        }
        
        return totalSize;
    }

    /**
     * تحديد نوع النسخة الاحتياطية
     */
    determineBackupType(name) {
        if (name.includes('comprehensive')) return 'comprehensive';
        if (name.includes('auto_backup')) return 'automated';
        if (name.includes('emergency')) return 'emergency';
        return 'manual';
    }

    /**
     * تحليل حماية السكريبت
     */
    analyzeScriptProtection(content) {
        let protectionScore = 0;
        
        // فحص وجود تأكيدات متعددة
        if (content.includes('requiredConfirmations') || content.includes('confirmation')) protectionScore += 3;
        
        // فحص وجود فحص البيئة
        if (content.includes('NODE_ENV') && content.includes('production')) protectionScore += 2;
        
        // فحص وجود نسخ احتياطية
        if (content.includes('backup') || content.includes('createBackup')) protectionScore += 2;
        
        // فحص وجود تسجيل
        if (content.includes('log') || content.includes('audit')) protectionScore += 1;
        
        // فحص وجود انتظار
        if (content.includes('setTimeout') || content.includes('انتظار')) protectionScore += 1;
        
        if (protectionScore >= 7) return 'MAXIMUM';
        if (protectionScore >= 5) return 'HIGH';
        if (protectionScore >= 3) return 'MEDIUM';
        if (protectionScore >= 1) return 'LOW';
        return 'NONE';
    }

    /**
     * تحديد حالة السكريبت
     */
    getScriptStatus(danger, protection) {
        if (danger === 'CRITICAL' && protection === 'MAXIMUM') return 'SECURED';
        if (danger === 'CRITICAL' && protection !== 'MAXIMUM') return 'VULNERABLE';
        if (danger === 'HIGH' && protection >= 'MEDIUM') return 'PROTECTED';
        if (danger === 'HIGH' && protection < 'MEDIUM') return 'AT_RISK';
        if (danger === 'MEDIUM') return 'MONITORED';
        return 'SAFE';
    }

    /**
     * تحليل الأحداث الأخيرة
     */
    analyzeRecentEvents(lines, type) {
        const recentLines = lines.slice(-10); // آخر 10 أحداث
        const events = [];
        
        for (const line of recentLines) {
            try {
                const event = JSON.parse(line);
                const age = (Date.now() - new Date(event.timestamp).getTime()) / (1000 * 60 * 60);
                
                if (age < 24) { // آخر 24 ساعة
                    events.push({
                        type: event.type || 'UNKNOWN',
                        message: event.message || 'No message',
                        age: age,
                        severity: this.determineEventSeverity(event.type, type)
                    });
                }
            } catch (error) {
                // تجاهل الأسطر المعطوبة
            }
        }
        
        return events;
    }

    /**
     * تحديد خطورة الحدث
     */
    determineEventSeverity(eventType, logType) {
        const severityMap = {
            'DANGEROUS_SCRIPT_EXECUTION': 'HIGH',
            'BACKUP_FAILED': 'HIGH',
            'RESTORE_FAILED': 'HIGH',
            'BACKUP_CREATED': 'LOW',
            'MONITOR_STARTED': 'LOW',
            'SYSTEM_INITIALIZED': 'LOW'
        };
        
        return severityMap[eventType] || 'MEDIUM';
    }

    /**
     * حساب الحالة العامة للنظام
     */
    calculateSystemStatus() {
        let score = 100;
        
        // فحص النسخ الاحتياطية
        const freshBackups = this.systemData.backups.filter(b => b.status === 'fresh').length;
        if (freshBackups === 0) score -= 30;
        else if (freshBackups < 2) score -= 10;
        
        // فحص حماية السكريبتات
        const vulnerableScripts = this.systemData.scripts.filter(s => s.status === 'VULNERABLE' || s.status === 'AT_RISK').length;
        score -= vulnerableScripts * 15;
        
        // فحص الإنذارات الحديثة
        const recentAlerts = this.systemData.alerts.filter(a => a.age < 1).length; // آخر ساعة
        score -= recentAlerts * 10;
        
        // تحديد المستوى
        if (score >= 90) this.systemData.currentStatus = { level: 'EXCELLENT', score: score, color: this.colors.safe };
        else if (score >= 75) this.systemData.currentStatus = { level: 'GOOD', score: score, color: this.colors.info };
        else if (score >= 60) this.systemData.currentStatus = { level: 'WARNING', score: score, color: this.colors.warning };
        else this.systemData.currentStatus = { level: 'CRITICAL', score: score, color: this.colors.danger };
    }

    /**
     * إنشاء المخطط التفاعلي المحدث
     */
    generateLiveDiagram() {
        const diagramData = {
            timestamp: new Date().toISOString(),
            systemStatus: this.systemData.currentStatus,
            nodes: this.generateNodes(),
            connections: this.generateConnections(),
            statistics: this.generateStatistics()
        };

        const htmlContent = this.generateHTMLTemplate(diagramData);
        
        const outputPath = 'live_security_dashboard.html';
        fs.writeFileSync(outputPath, htmlContent);
        
        console.log(`✅ تم إنشاء المخطط التفاعلي المحدث: ${outputPath}`);
        return outputPath;
    }

    /**
     * إنشاء العقد (النودز) للمخطط
     */
    generateNodes() {
        const nodes = [];

        // عقدة النظام الرئيسية
        nodes.push({
            id: 'system_core',
            label: 'نظام إدارة الفصول',
            color: this.colors.info,
            size: 30,
            x: 0,
            y: 0,
            physics: false
        });

        // عقد قواعد البيانات - مبسطة
        const databases = [
            { id: 'db_main', name: 'classroom.db', angle: 0 },
            { id: 'db_dev', name: 'classroom_dev.db', angle: 120 },
            { id: 'db_test', name: 'classroom_test.db', angle: 240 }
        ];

        databases.forEach(db => {
            const x = Math.cos(db.angle * Math.PI / 180) * 180;
            const y = Math.sin(db.angle * Math.PI / 180) * 180;
            
            nodes.push({
                id: db.id,
                label: db.name,
                color: '#8b5cf6', // بنفسجي لقواعد البيانات
                size: 25,
                x: x,
                y: y,
                physics: false
            });

            // جداول مبسطة لكل قاعدة بيانات
            const tables = ['students', 'teachers', 'sections', 'subjects', 'schedule'];
            
            tables.forEach((table, index) => {
                const tableAngle = db.angle + ((index - 2) * 15); // توزيع الجداول حول قاعدة البيانات
                const tableX = x + Math.cos(tableAngle * Math.PI / 180) * 80;
                const tableY = y + Math.sin(tableAngle * Math.PI / 180) * 80;
                const tableId = `${db.id}_${table}`;
                
                nodes.push({
                    id: tableId,
                    label: table,
                    color: '#06b6d4', // سماوي للجداول
                    size: 15,
                    x: tableX,
                    y: tableY,
                    physics: false
                });
            });
        });

        // عقد النسخ الاحتياطية (مبسطة)
        for (let i = 0; i < 3; i++) {
            const backupAngle = -90 + (i * 30); // في الجانب الأيسر
            const backupRadius = 320;
            nodes.push({
                id: `backup_${i}`,
                label: `نسخة احتياطية ${i + 1}`,
                color: this.colors.safe,
                size: 20,
                x: Math.cos(backupAngle * Math.PI / 180) * backupRadius,
                y: Math.sin(backupAngle * Math.PI / 180) * backupRadius,
                physics: false
            });
        }

        // عقد السكريبتات (مبسطة في الجانب الأيمن)
        const scripts = ['reset_db.js', 'manual_migration.js'];
        scripts.forEach((script, index) => {
            const scriptAngle = 90 + (index * 30);
            const scriptRadius = 320;
            nodes.push({
                id: `script_${script}`,
                label: script,
                color: this.colors.warning,
                size: 22,
                x: Math.cos(scriptAngle * Math.PI / 180) * scriptRadius,
                y: Math.sin(scriptAngle * Math.PI / 180) * scriptRadius,
                physics: false
            });
        });

        // خدمات النظام (في الأسفل)
        nodes.push({
            id: 'monitor',
            label: 'المراقبة الأمنية',
            color: this.colors.info,
            size: 20,
            x: -120,
            y: 300,
            physics: false
        });

        nodes.push({
            id: 'backup_service',
            label: 'خدمة النسخ',
            color: this.colors.safe,
            size: 20,
            x: 120,
            y: 300,
            physics: false
        });

        return nodes;
    }

    /**
     * الحصول على جداول قاعدة البيانات
     */
    getDatabaseTables(dbName) {
        // جداول أساسية مشتركة
        const commonTables = [
            { name: 'students', type: 'critical', records: '500+' },
            { name: 'sections', type: 'critical', records: '20+' },
            { name: 'teachers', type: 'important', records: '50+' },
            { name: 'subjects', type: 'important', records: '30+' },
            { name: 'schedule', type: 'critical', records: '200+' },
            { name: 'attendance', type: 'critical', records: '5000+' },
            { name: 'grades', type: 'critical', records: '2000+' },
            { name: 'users', type: 'security', records: '10+' }
        ];

        // جداول إضافية حسب البيئة
        if (dbName.includes('dev')) {
            return [...commonTables, 
                { name: 'test_data', type: 'temporary', records: '100+' },
                { name: 'debug_logs', type: 'temporary', records: '50+' }
            ];
        } else if (dbName.includes('test')) {
            return [...commonTables.slice(0, 5),
                { name: 'mock_data', type: 'temporary', records: '20+' }
            ];
        }

        return commonTables;
    }

    /**
     * إنشاء الاتصالات بين العقد
     */
    generateConnections() {
        const connections = [];

        // ربط النظام بقواعد البيانات
        const databases = ['db_main', 'db_dev', 'db_test'];
        databases.forEach(db => {
            connections.push({
                from: 'system_core',
                to: db,
                color: '#3b82f6',
                width: 3
            });

            // ربط قواعد البيانات بجداولها
            const tables = ['students', 'teachers', 'sections', 'subjects', 'schedule'];
            tables.forEach(table => {
                connections.push({
                    from: db,
                    to: `${db}_${table}`,
                    color: '#6b7280',
                    width: 1
                });
            });
        });

        // ربط النظام الأساسي بالنسخ الاحتياطية
        for (let i = 0; i < Math.min(5, this.systemData.backups.length); i++) {
            connections.push({
                from: 'system_core',
                to: `backup_${i}`,
                type: 'protection',
                status: this.systemData.backups[i].status,
                color: this.systemData.backups[i].status === 'fresh' ? this.colors.safe : 
                       this.systemData.backups[i].status === 'good' ? this.colors.info : this.colors.warning,
                width: 2
            });
        }

        // ربط النظام بالسكريپتات (في مواقع محددة)
        for (const script of this.systemData.scripts) {
            connections.push({
                from: 'system_core',
                to: `script_${script.name}`,
                type: 'control',
                status: script.status,
                color: script.status === 'SECURED' ? this.colors.safe :
                       script.status === 'PROTECTED' ? this.colors.info :
                       script.status === 'VULNERABLE' ? this.colors.danger : this.colors.warning,
                width: script.danger === 'CRITICAL' ? 4 : 2
            });
        }

        // ربط النظام بأنظمة المراقبة
        connections.push({
            from: 'system_core',
            to: 'security_monitor',
            type: 'monitoring',
            status: 'ACTIVE',
            color: this.colors.info,
            width: 3
        });

        connections.push({
            from: 'system_core',
            to: 'backup_service',
            type: 'service',
            status: 'ACTIVE',
            color: this.colors.safe,
            width: 3
        });

        // ربط المراقبة بالسكریپتات
        for (const script of this.systemData.scripts) {
            connections.push({
                from: 'security_monitor',
                to: `script_${script.name}`,
                type: 'watch',
                status: 'MONITORING',
                color: this.colors.neutral,
                width: 1,
                dashes: true
            });
        }

        // إضافة علاقات بين الجداول المترابطة
        databases.forEach(db => {
            // ربط students بـ sections
            connections.push({
                from: `table_${db}_students`,
                to: `table_${db}_sections`,
                type: 'relation',
                color: this.colors.neutral,
                width: 1,
                dashes: [5, 5]
            });

            // ربط schedule بـ teachers و subjects
            if (this.getDatabaseTables(db).find(t => t.name === 'schedule')) {
                connections.push({
                    from: `table_${db}_schedule`,
                    to: `table_${db}_teachers`,
                    type: 'relation',
                    color: this.colors.neutral,
                    width: 1,
                    dashes: [5, 5]
                });
                connections.push({
                    from: `table_${db}_schedule`,
                    to: `table_${db}_subjects`,
                    type: 'relation',
                    color: this.colors.neutral,
                    width: 1,
                    dashes: [5, 5]
                });
            }

            // ربط attendance بـ students
            if (this.getDatabaseTables(db).find(t => t.name === 'attendance')) {
                connections.push({
                    from: `table_${db}_attendance`,
                    to: `table_${db}_students`,
                    type: 'relation',
                    color: this.colors.neutral,
                    width: 1,
                    dashes: [5, 5]
                });
            }
        });

        return connections;
    }

    /**
     * إنشاء الإحصائيات
     */
    generateStatistics() {
        return {
            totalBackups: this.systemData.backups.length,
            freshBackups: this.systemData.backups.filter(b => b.status === 'fresh').length,
            protectedScripts: this.systemData.scripts.filter(s => s.status === 'SECURED' || s.status === 'PROTECTED').length,
            vulnerableScripts: this.systemData.scripts.filter(s => s.status === 'VULNERABLE' || s.status === 'AT_RISK').length,
            recentAlerts: this.systemData.alerts.length,
            activeServices: this.systemData.logs.length,
            overallScore: this.systemData.currentStatus.score
        };
    }

    /**
     * إنشاء قالب HTML التفاعلي
     */
    generateHTMLTemplate(data) {
        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة الأمان التفاعلية المباشرة - Live Security Dashboard</title>
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }

        .header {
            background: rgba(0, 0, 0, 0.2);
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .status-bar {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-top: 15px;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 20px;
            border-radius: 25px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }

        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .dashboard-container {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 20px;
            padding: 20px;
            height: calc(100vh - 200px);
        }

        .network-container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .sidebar {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .stats-panel, .alerts-panel, .logs-panel {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .panel-title {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            border-bottom: 2px solid rgba(255, 255, 255, 0.3);
            padding-bottom: 10px;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-value {
            font-weight: bold;
            font-size: 1.1rem;
        }

        .alert-item, .log-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 10px;
            border-left: 4px solid;
        }

        .alert-high { border-left-color: #ef4444; }
        .alert-medium { border-left-color: #fbbf24; }
        .alert-low { border-left-color: #4ade80; }

        .timestamp {
            font-size: 0.8rem;
            opacity: 0.7;
            margin-top: 5px;
        }

        .refresh-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(45deg, #4ade80, #22c55e);
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
            transition: all 0.3s ease;
            animation: rotate 2s infinite linear;
        }

        .refresh-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .legend {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 50%;
        }

        #networkGraph {
            width: 100%;
            height: 100%;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ لوحة الأمان التفاعلية المباشرة</h1>
        <p>آخر تحديث: ${new Date(data.timestamp).toLocaleString('ar-SA')}</p>
        
        <div class="status-bar">
            <div class="status-indicator">
                <div class="status-dot" style="background-color: ${data.systemStatus.color};"></div>
                <span>حالة النظام: ${data.systemStatus.level}</span>
            </div>
            <div class="status-indicator">
                <div class="status-dot" style="background-color: #4ade80;"></div>
                <span>النقاط: ${data.systemStatus.score}/100</span>
            </div>
        </div>
    </div>

    <div class="dashboard-container">
        <div class="network-container">
            <div id="networkGraph"></div>
            
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${this.colors.safe};"></div>
                    <span>آمن ومحمي</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${this.colors.info};"></div>
                    <span>نشط وتحت المراقبة</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${this.colors.warning};"></div>
                    <span>يحتاج انتباه</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${this.colors.danger};"></div>
                    <span>خطر - يحتاج إجراء فوري</span>
                </div>
            </div>
        </div>

        <div class="sidebar">
            <div class="stats-panel">
                <div class="panel-title">📊 الإحصائيات المباشرة</div>
                <div class="stat-item">
                    <span>النسخ الاحتياطية:</span>
                    <span class="stat-value">${data.statistics.totalBackups}</span>
                </div>
                <div class="stat-item">
                    <span>النسخ الحديثة:</span>
                    <span class="stat-value" style="color: ${this.colors.safe};">${data.statistics.freshBackups}</span>
                </div>
                <div class="stat-item">
                    <span>السكريبتات المحمية:</span>
                    <span class="stat-value" style="color: ${this.colors.safe};">${data.statistics.protectedScripts}</span>
                </div>
                <div class="stat-item">
                    <span>السكريبتات المعرضة:</span>
                    <span class="stat-value" style="color: ${this.colors.danger};">${data.statistics.vulnerableScripts}</span>
                </div>
                <div class="stat-item">
                    <span>الإنذارات الحديثة:</span>
                    <span class="stat-value" style="color: ${data.statistics.recentAlerts > 0 ? this.colors.warning : this.colors.safe};">${data.statistics.recentAlerts}</span>
                </div>
                <div class="stat-item">
                    <span>الخدمات النشطة:</span>
                    <span class="stat-value" style="color: ${this.colors.info};">${data.statistics.activeServices}</span>
                </div>
            </div>

            <div class="alerts-panel">
                <div class="panel-title">🚨 الإنذارات الحديثة</div>
                ${this.systemData.alerts.length > 0 ? 
                    this.systemData.alerts.slice(0, 3).map(alert => `
                        <div class="alert-item alert-${alert.severity.toLowerCase()}">
                            <div><strong>${alert.type}</strong></div>
                            <div class="timestamp">منذ ${alert.age.toFixed(1)} ساعة</div>
                        </div>
                    `).join('') : 
                    '<div style="text-align: center; color: #4ade80;">✅ لا توجد إنذارات حديثة</div>'
                }
            </div>

            <div class="logs-panel">
                <div class="panel-title">📝 آخر الأحداث</div>
                ${this.systemData.logs.length > 0 ? 
                    this.systemData.logs.slice(0, 3).map(log => `
                        <div class="log-item">
                            <div><strong>${log.type.toUpperCase()}</strong></div>
                            <div>الأحداث: ${log.totalEvents}</div>
                            <div class="timestamp">${new Date(log.lastUpdate).toLocaleString('ar-SA')}</div>
                        </div>
                    `).join('') : 
                    '<div style="text-align: center;">📝 لا توجد لوقات متاحة</div>'
                }
            </div>
        </div>
    </div>

    <button class="refresh-btn" onclick="refreshData()" title="تحديث البيانات">
        🔄
    </button>

    <script>
        // بيانات المخطط
        const nodes = new vis.DataSet(${JSON.stringify(data.nodes)});
        const edges = new vis.DataSet(${JSON.stringify(data.connections.map(conn => ({
            from: conn.from,
            to: conn.to,
            color: conn.status === 'ACTIVE' || conn.status === 'SECURED' ? this.colors.safe :
                   conn.status === 'PROTECTED' || conn.status === 'MONITORING' ? this.colors.info :
                   conn.status === 'VULNERABLE' ? this.colors.danger : this.colors.warning,
            width: 2,
            arrows: 'to'
        })))});

        // إعدادات المخطط
        const options = {
            nodes: {
                shape: 'dot',
                font: {
                    size: 14,
                    color: 'white',
                    face: 'Arial',
                    strokeWidth: 1,
                    strokeColor: 'black'
                },
                borderWidth: 3,
                borderColor: 'white',
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.5)',
                    size: 15,
                    x: 3,
                    y: 3
                }
            },
            edges: {
                font: {
                    size: 10,
                    color: 'white'
                },
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.3)'
                },
                smooth: {
                    enabled: false
                },
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 1.2
                    }
                }
            },
            physics: {
                enabled: false
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                hideEdgesOnDrag: false,
                dragNodes: true,
                dragView: true,
                zoomView: true
            },
            layout: {
                improvedLayout: false
            }
        };

        // إنشاء المخطط
        const container = document.getElementById('networkGraph');
        const network = new vis.Network(container, { nodes, edges }, options);

        // إضافة tooltip للعقد
        network.on('hoverNode', function(params) {
            const nodeId = params.node;
            const node = nodes.get(nodeId);
            
            if (node && node.details) {
                // يمكن إضافة tooltip مخصص هنا
                container.title = node.details;
            }
        });

        // تحديث البيانات
        function refreshData() {
            // في التطبيق الحقيقي، يمكن جلب البيانات الجديدة من API
            location.reload();
        }

        // تحديث تلقائي كل دقيقتين
        setInterval(refreshData, 120000);

        // تأثيرات بصرية
        network.on('stabilizationIterationsDone', function() {
            network.setOptions({ physics: false });
        });

        // رسائل التفاعل
        network.on('click', function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = nodes.get(nodeId);
                
                if (node) {
                    alert('تفاصيل العقدة:\\n' + node.details);
                }
            }
        });

        console.log('🛡️ تم تحميل لوحة الأمان التفاعلية المباشرة بنجاح');
        console.log('📊 البيانات المحملة:', ${JSON.stringify(data.statistics)});
    </script>
</body>
</html>`;
    }

    /**
     * بدء إنشاء المخطط المحدث
     */
    async generateLiveSecurityDiagram() {
        console.log('🚀 بدء إنشاء المخطط الأمني التفاعلي المباشر...\n');
        
        await this.collectLiveData();
        const diagramPath = this.generateLiveDiagram();
        
        console.log('\n🎉 تم إنشاء المخطط التفاعلي المحدث بنجاح!');
        console.log(`📍 المسار: ${diagramPath}`);
        console.log(`🌐 افتح الملف في المتصفح لمشاهدة المخطط التفاعلي`);
        
        return diagramPath;
    }
}

// تشغيل المولد
if (require.main === module) {
    const generator = new LiveSecurityDiagramGenerator();
    generator.generateLiveSecurityDiagram()
        .then(path => {
            console.log(`\n✅ المخطط جاهز: ${path}`);
        })
        .catch(error => {
            console.error('❌ خطأ في إنشاء المخطط:', error);
        });
}

module.exports = LiveSecurityDiagramGenerator;
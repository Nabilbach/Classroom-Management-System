#!/usr/bin/env node
/**
 * مولد المخطط الأمني المبسط
 * Simplified Security Diagram Generator
 */

const fs = require('fs');

class SimplifiedSecurityDiagramGenerator {
    constructor() {
        this.colors = {
            system: '#3b82f6',    // أزرق للنظام
            database: '#8b5cf6',  // بنفسجي لقواعد البيانات
            table: '#06b6d4',     // سماوي للجداول
            backup: '#22c55e',    // أخضر للنسخ الاحتياطية
            script: '#f59e0b',    // برتقالي للسكريپتات
            service: '#10b981',   // أخضر فاتح للخدمات
            alert_critical: '#ef4444',  // أحمر للإنذارات الحرجة
            alert_high: '#f97316',      // برتقالي للإنذارات المهمة
            alert_medium: '#eab308',    // أصفر للإنذارات المتوسطة
            alert_pulse: '#ff0000'      // أحمر وامض للتنبيهات
        };
        
        this.alertsData = null;
    }

    async generateSimplifiedDiagram() {
        console.log('🚀 إنشاء المخطط الأمني المبسط مع الإشعارات...');
        
        // جمع بيانات الإشعارات
        await this.collectAlertsData();
        
        const data = this.createSimpleTreeData();
        const html = this.createSimpleHTML(data);
        
        fs.writeFileSync('simplified_security_dashboard.html', html);
        console.log('✅ تم إنشاء المخطط المبسط مع الإشعارات: simplified_security_dashboard.html');
        
        return 'simplified_security_dashboard.html';
    }

    /**
     * جمع بيانات الإشعارات الأمنية
     */
    async collectAlertsData() {
        try {
            const LiveSecurityAlertsSystem = require('./live_security_alerts_system.cjs');
            const alertSystem = new LiveSecurityAlertsSystem();
            
            await alertSystem.performSecurityScan();
            this.alertsData = alertSystem.exportForDiagram();
            
            console.log(`📊 تم جمع ${this.alertsData.alerts.length} إشعار أمني`);
            console.log(`🎯 مستوى الأمان: ${this.alertsData.stats.securityLevel}%`);
        } catch (error) {
            console.error('⚠️ خطأ في جمع الإشعارات:', error.message);
            this.alertsData = {
                alerts: [],
                topAlerts: [],
                stats: { total: 0, securityLevel: 100 },
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * الحصول على لون الإنذار حسب الخطورة
     */
    getAlertColor(severity) {
        const alertColors = {
            'CRITICAL': '#ef4444',
            'HIGH': '#f97316', 
            'MEDIUM': '#eab308',
            'LOW': '#06b6d4',
            'INFO': '#22c55e'
        };
        return alertColors[severity] || '#6b7280';
    }

    /**
     * الحصول على أيقونة الإنذار حسب الخطورة
     */
    getAlertIcon(severity) {
        const alertIcons = {
            'CRITICAL': '🚨',
            'HIGH': '⚠️',
            'MEDIUM': '⚡',
            'LOW': 'ℹ️',
            'INFO': '✅'
        };
        return alertIcons[severity] || '•';
    }

    /**
     * الحصول على إنذارات نود معين
     */
    getNodeAlerts(nodeType, nodeId = '') {
        if (!this.alertsData?.alerts) return [];
        
        return this.alertsData.alerts.filter(alert => {
            if (nodeType === 'system') {
                return alert.component === 'system' || alert.severity === 'CRITICAL';
            }
            if (nodeType === 'database') {
                return alert.component === 'database' && alert.target?.includes(nodeId);
            }
            if (nodeType === 'backup') {
                return alert.component === 'backup';
            }
            if (nodeType === 'script') {
                return alert.component === 'script';
            }
            return false;
        });
    }

    /**
     * إنشاء نص تلميح الإنذارات
     */
    createAlertTooltip(alerts, nodeName) {
        if (!alerts || alerts.length === 0) {
            return `${nodeName}<br/>✅ لا توجد إنذارات أمنية`;
        }
        
        let tooltip = `<strong>${nodeName}</strong><br/>`;
        tooltip += `🚨 الإنذارات (${alerts.length}):<br/>`;
        
        alerts.slice(0, 3).forEach(alert => {
            const icon = this.getAlertIcon(alert.severity);
            tooltip += `${icon} ${alert.message}<br/>`;
        });
        
        if (alerts.length > 3) {
            tooltip += `... و ${alerts.length - 3} إنذار إضافي`;
        }
        
        return tooltip;
    }

    /**
     * إنشاء لوحة الإشعارات الأمنية
     */
    createAlertsPanel() {
        if (!this.alertsData) return '';
        
        const securityLevel = this.alertsData.stats?.securityLevel || 100;
        const alerts = this.alertsData.topAlerts || [];
        
        let scoreClass = 'score-good';
        if (securityLevel < 50) scoreClass = 'score-critical';
        else if (securityLevel < 80) scoreClass = 'score-warning';
        
        let alertsHTML = '';
        alerts.slice(0, 8).forEach(alert => {
            if (!alert || !alert.severity) return;
            
            const icon = this.getAlertIcon(alert.severity);
            const severity = alert.severity.toLowerCase();
            alertsHTML += `
                <div class="alert-item alert-${severity}">
                    <span style="font-size: 1.2em;">${icon}</span>
                    <div>
                        <div style="font-weight: bold;">${alert.severity}</div>
                        <div style="font-size: 0.9em;">${alert.message || 'رسالة غير متاحة'}</div>
                        ${alert.timestamp ? `<div style="font-size: 0.8em; opacity: 0.7;">${new Date(alert.timestamp).toLocaleTimeString('ar')}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        return `
            <div class="alerts-panel" id="alertsPanel" style="display: none; opacity: 0; visibility: hidden;">
                <h4 style="margin-bottom: 15px; text-align: center;">🛡️ الحالة الأمنية</h4>
                
                <div class="security-score ${scoreClass}">
                    🎯 مستوى الأمان: ${securityLevel}%
                </div>
                
                <h5 style="margin-bottom: 10px;">🚨 الإنذارات الحالية (${alerts.length}):</h5>
                
                ${alerts.length > 0 ? alertsHTML : '<div class="alert-item alert-info"><span>✅</span><div>لا توجد إنذارات أمنية</div></div>'}
                
                <div style="text-align: center; margin-top: 15px; font-size: 0.8em; opacity: 0.7;">
                    آخر تحديث: ${this.alertsData.timestamp ? new Date(this.alertsData.timestamp).toLocaleString('ar') : 'غير متاح'}
                </div>
            </div>
        `;
    }

    createSimpleTreeData() {
        console.log('🔄 توليد هيكل الشجرة المتفرعة...');
        const nodes = [];
        const edges = [];

        // حساب مستوى الأمان والتحذيرات
        const securityLevel = this.alertsData?.stats?.securityLevel || 100;
        const systemAlerts = this.getNodeAlerts('system');
        const hasCritical = systemAlerts.some(a => a.severity === 'CRITICAL');
        
        // 1. النظام الأساسي (المركز)
        console.log('🏗️ إنشاء عقدة النظام الأساسي...');
        nodes.push({
            id: 'system',
            label: `🏫 نظام إدارة الفصول\n🛡️ ${securityLevel}%`,
            color: {
                background: hasCritical ? '#ef4444' : (securityLevel < 70 ? '#f97316' : '#3b82f6'),
                border: '#1e3a8a',
                highlight: {
                    background: hasCritical ? '#dc2626' : (securityLevel < 70 ? '#ea580c' : '#2563eb'),
                    border: '#1e3a8a'
                }
            },
            size: 40,
            x: 0,
            y: -200,
            physics: false,
            fixed: true,
            font: {
                size: 16,
                color: 'white',
                multi: true,
                bold: true,
                strokeWidth: 2,
                strokeColor: '#000000'
            },
            title: this.createAlertTooltip(systemAlerts, 'النظام الأساسي')
        });

        // 2. الأجنحة الرئيسية
        console.log('🏗️ إنشاء أجنحة النظام...');
        const wings = [
            { id: 'students', label: '👥 شؤون التلاميذ', x: -200, y: -100 },
            { id: 'teachers', label: '👨‍🏫 شؤون الأساتذة', x: 200, y: -100 },
            { id: 'schedule', label: '📅 الجدولة', x: -200, y: 100 },
            { id: 'attendance', label: '📊 الحضور', x: 200, y: 100 }
        ];

        wings.forEach(wing => {
            const wingAlerts = this.alertsData?.alerts?.filter(a => a.component === wing.id) || [];
            const hasWingCritical = wingAlerts.some(a => a.severity === 'CRITICAL');
            const wingWarnings = wingAlerts.length;
            
            // إضافة عقدة الجناح
            nodes.push({
                id: wing.id,
                label: `${wing.label}\n${wingWarnings ? `⚠️ ${wingWarnings}` : '✅'}`,
                color: {
                    background: hasWingCritical ? '#ef4444' : (wingWarnings ? '#f97316' : '#22c55e'),
                    border: '#1e3a8a',
                    highlight: {
                        background: hasWingCritical ? '#dc2626' : (wingWarnings ? '#ea580c' : '#16a34a'),
                        border: '#1e3a8a'
                    }
                },
                size: 30,
                x: wing.x,
                y: wing.y,
                physics: false,
                fixed: true,
                font: {
                    size: 14,
                    color: 'white',
                    multi: true,
                    bold: true,
                    strokeWidth: 2,
                    strokeColor: '#000000'
                },
                title: this.createAlertTooltip(wingAlerts, wing.label)
            });
            
            // إضافة الحواف بين المركز والأجنحة
            edges.push({
                from: 'system',
                to: wing.id,
                width: 3,
                color: {
                    color: hasWingCritical ? '#ef4444' : (wingWarnings ? '#f97316' : '#3b82f6'),
                    highlight: hasWingCritical ? '#dc2626' : (wingWarnings ? '#ea580c' : '#2563eb')
                },
                smooth: {
                    type: 'curvedCW',
                    roundness: 0.2
                }
            });
            
            // إضافة الفروع لكل جناح
            const branches = this.getBranchesForWing(wing.id);
            branches.forEach((branch, index) => {
                const branchAlerts = this.alertsData?.alerts?.filter(
                    a => a.component === wing.id && a.subComponent === branch.id
                ) || [];
                const hasBranchCritical = branchAlerts.some(a => a.severity === 'CRITICAL');
                const branchWarnings = branchAlerts.length;
                
                const angle = (Math.PI / (branches.length + 1)) * (index + 1);
                const radius = 150;
                const x = wing.x + radius * Math.cos(angle);
                const y = wing.y + radius * Math.sin(angle);
                
                const branchId = `${wing.id}_${branch.id}`;
                nodes.push({
                    id: branchId,
                    label: `${branch.label}\n${branchWarnings ? `⚠️ ${branchWarnings}` : '✅'}`,
                    color: {
                        background: hasBranchCritical ? '#ef4444' : (branchWarnings ? '#f97316' : '#22c55e'),
                        border: '#1e3a8a',
                        highlight: {
                            background: hasBranchCritical ? '#dc2626' : (branchWarnings ? '#ea580c' : '#16a34a'),
                            border: '#1e3a8a'
                        }
                    },
                    size: 25,
                    x: x,
                    y: y,
                    physics: false,
                    fixed: true,
                    font: {
                        size: 12,
                        color: 'white',
                        multi: true,
                        bold: true,
                        strokeWidth: 2,
                        strokeColor: '#000000'
                    },
                    title: this.createAlertTooltip(branchAlerts, branch.label)
                });
                
                // إضافة الحواف بين الأجنحة والفروع
                edges.push({
                    from: wing.id,
                    to: branchId,
                    width: 2,
                    color: {
                        color: hasBranchCritical ? '#ef4444' : (branchWarnings ? '#f97316' : '#3b82f6'),
                        highlight: hasBranchCritical ? '#dc2626' : (branchWarnings ? '#ea580c' : '#2563eb')
                    },
                    smooth: {
                        type: 'curvedCW',
                        roundness: 0.2
                    }
                });
            });
        });

        return { nodes, edges };
    }

    /**
     * الحصول على فروع جناح معين
     */
    getBranchesForWing(wingId) {
        switch (wingId) {
            case 'students':
                return [
                    { id: 'registration', label: '📝 التسجيل' },
                    { id: 'info', label: '📋 المعلومات' },
                    { id: 'grades', label: '📊 الدرجات' }
                ];
            case 'teachers':
                return [
                    { id: 'assignments', label: '📚 المهام' },
                    { id: 'schedule', label: '🗓️ الجدول' },
                    { id: 'reports', label: '📑 التقارير' }
                ];
            case 'schedule':
                return [
                    { id: 'classes', label: '🏫 الفصول' },
                    { id: 'exams', label: '📝 الامتحانات' },
                    { id: 'events', label: '🎯 الأحداث' }
                ];
            case 'attendance':
                return [
                    { id: 'tracking', label: '👀 التتبع' },
                    { id: 'reports', label: '📊 التقارير' },
                    { id: 'alerts', label: '🔔 التنبيهات' }
                ];
            default:
                return [];
        }
    }

    createSimpleHTML(data) {
        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🛡️ المخطط الأمني المبسط - نظام إدارة الفصول</title>
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%);
            color: white;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .stat-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 10px 20px;
            border-radius: 20px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .container {
            padding: 20px;
            height: calc(100vh - 140px);
        }
        
        #networkGraph {
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .legend {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            min-width: 200px;
            backdrop-filter: blur(10px);
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid white;
        }

        .controls {
            position: fixed;
            top: 140px;
            left: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .control-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 25px;
            padding: 10px 15px;
            color: white;
            cursor: pointer;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .control-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            cursor: pointer;
        }

        .control-btn:active {
            transform: translateY(0px);
            background: rgba(255, 255, 255, 0.4);
        }

        .alerts-btn {
            background: rgba(239, 68, 68, 0.3) !important;
            border-color: #ef4444 !important;
            font-weight: bold;
        }

        .alerts-btn:hover {
            background: rgba(239, 68, 68, 0.5) !important;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }

        .alerts-panel {
            overflow-y: auto;
            z-index: 1000;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.95);
            padding: 15px;
            border-radius: 10px;
            min-width: 300px;
            max-width: 400px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            transition: all 0.3s ease;
        }

        .alert-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            margin: 5px 0;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.1);
            border-left: 4px solid;
        }

        .alert-critical { border-left-color: #ef4444; }
        .alert-high { border-left-color: #f97316; }
        .alert-medium { border-left-color: #eab308; }
        .alert-low { border-left-color: #06b6d4; }
        .alert-info { border-left-color: #22c55e; }

        .security-score {
            font-size: 1.5rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 8px;
        }

        .score-critical { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
        .score-warning { background: rgba(249, 115, 22, 0.2); color: #fdba74; }
        .score-good { background: rgba(34, 197, 94, 0.2); color: #86efac; }

        .toggle-alerts {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: none;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1001;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ المخطط الأمني التفاعلي</h1>
        <p>نظام إدارة الفصول الدراسية - عرض الشجرة المتفرعة</p>
        <div class="stats">
            <div class="stat-item">📊 العقد: <strong>${data.nodes.length}</strong></div>
            <div class="stat-item">🔗 الاتصالات: <strong>${data.edges.length}</strong></div>
            <div class="stat-item">🗄️ قواعد البيانات: <strong>3</strong></div>
            <div class="stat-item">📋 الجداول: <strong>15</strong></div>
            <div class="stat-item">💾 النسخ الاحتياطية: <strong>4</strong></div>
            <div class="stat-item">🛡️ مستوى الأمان: <strong>${this.alertsData?.stats?.securityLevel || 100}%</strong></div>
        </div>
    </div>

    <div class="controls">
        <button class="control-btn" onclick="resetView()">🎯 إعادة التموضع</button>
        <button class="control-btn" onclick="fitNetwork()">📐 ملء الشاشة</button>
        <button class="control-btn" onclick="exportImage()">📸 تصدير صورة</button>
        <button class="control-btn alerts-btn" id="alertsToggleBtn" onclick="toggleAlerts()">🚨 الإشعارات الأمنية</button>
    </div>

    ${this.createAlertsPanel()}

    <div class="container">
        <div id="networkGraph"></div>
    </div>

    <div class="legend">
        <h4 style="margin-bottom: 10px;">🎨 دليل الألوان</h4>
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${this.colors.system};"></div>
            <span>النظام الأساسي</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${this.colors.database};"></div>
            <span>قواعد البيانات</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${this.colors.table};"></div>
            <span>الجداول</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${this.colors.backup};"></div>
            <span>النسخ الاحتياطية</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${this.colors.script};"></div>
            <span>السكريپتات الخطرة</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${this.colors.service};"></div>
            <span>خدمات النظام</span>
        </div>
    </div>

    <script>
        console.log('🚀 بدء تحميل المخطط الأمني المبسط...');
        
        // البيانات
        const nodes = new vis.DataSet(${JSON.stringify(data.nodes, null, 2)});
        const edges = new vis.DataSet(${JSON.stringify(data.edges, null, 2)});

        console.log('📊 تم تحميل', nodes.length, 'عقدة و', edges.length, 'اتصال');

        // إعدادات المخطط
        const options = {
            nodes: {
                shape: 'dot',
                font: {
                    size: 14,
                    color: 'white',
                    face: 'Arial',
                    strokeWidth: 2,
                    strokeColor: 'black'
                },
                borderWidth: 3,
                borderColor: 'white',
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.5)',
                    size: 8,
                    x: 3,
                    y: 3
                }
            },
            edges: {
                color: {
                    color: '#ffffff',
                    highlight: '#ffff00'
                },
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
                }
            },
            physics: {
                enabled: false
            },
            interaction: {
                dragNodes: true,
                dragView: true,
                zoomView: true,
                hover: true,
                selectConnectedEdges: true
            }
        };

        // إنشاء المخطط
        const container = document.getElementById('networkGraph');
        const network = new vis.Network(container, { nodes, edges }, options);

        // الأحداث
        network.on('click', function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = nodes.get(nodeId);
                
                // إظهار معلومات العقدة
                let info = 'معلومات العقدة:\\n';
                info += '🏷️ الاسم: ' + node.label + '\\n';
                info += '🆔 المعرف: ' + node.id + '\\n';
                info += '📍 الموقع: (' + Math.round(node.x) + ', ' + Math.round(node.y) + ')';
                
                alert(info);
            }
        });

        network.on('hoverNode', function(params) {
            container.style.cursor = 'pointer';
        });

        network.on('blurNode', function(params) {
            container.style.cursor = 'default';
        });

        // دوال التحكم
        function resetView() {
            network.fit();
            console.log('🎯 تم إعادة تموضع المخطط');
        }

        function fitNetwork() {
            network.fit({
                animation: {
                    duration: 1000,
                    easingFunction: 'easeInOutQuad'
                }
            });
            console.log('📐 تم ملء الشاشة');
        }

        function exportImage() {
            // محاولة تصدير صورة (يتطلب مكتبة إضافية)
            alert('ميزة تصدير الصورة ستكون متاحة في التحديث القادم! 📸');
        }

        function toggleAlerts() {
            console.log('🎯 محاولة تبديل لوحة الإشعارات...');
            const panel = document.getElementById('alertsPanel');
            const button = document.getElementById('alertsToggleBtn');
            
            if (!panel) {
                console.error('❌ لم يتم العثور على لوحة الإشعارات!');
                alert('خطأ: لم يتم العثور على لوحة الإشعارات! (Element ID: alertsPanel)');
                return;
            }
            
            console.log('📊 حالة اللوحة الحالية:', panel.style.display);
            
            if (panel.style.display === 'none' || panel.style.display === '') {
                panel.style.display = 'block';
                panel.style.opacity = '1';
                panel.style.visibility = 'visible';
                if (button) {
                    button.style.backgroundColor = 'rgba(34, 197, 94, 0.4)';
                    button.setAttribute('aria-pressed', 'true');
                }
                console.log('✅ تم إظهار لوحة الإشعارات الأمنية');
            } else {
                panel.style.display = 'none';
                panel.style.opacity = '0';
                panel.style.visibility = 'hidden';
                if (button) {
                    button.style.backgroundColor = '';
                    button.setAttribute('aria-pressed', 'false');
                }
                console.log('✅ تم إخفاء لوحة الإشعارات الأمنية');
            }
        }

        // إضافة اختبار للتأكد من وجود العناصر
        function testElements() {
            console.log('🧪 اختبار وجود العناصر...');
            const panel = document.getElementById('alertsPanel');
            const button = document.getElementById('alertsToggleBtn');
            
            console.log('🔍 لوحة الإشعارات:', panel ? '✅ موجودة' : '❌ غير موجودة');
            console.log('🔍 زر الإشعارات:', button ? '✅ موجود' : '❌ غير موجود');
            
            if (panel) {
                console.log('📊 معلومات اللوحة:');
                console.log('  - Display:', panel.style.display);
                console.log('  - Visibility:', panel.style.visibility);
                console.log('  - Opacity:', panel.style.opacity);
            }
        }

        // إضافة مستمعات الأحداث للأزرار
        function setupEventListeners() {
            console.log('🔧 إعداد مستمعات الأحداث...');
            
            // زر الإشعارات
            const alertButton = document.getElementById('alertsToggleBtn');
            if (alertButton) {
                console.log('✅ تم العثور على زر الإشعارات');
                
                // إزالة onclick القديم
                alertButton.removeAttribute('onclick');
                
                // إضافة مستمع حدث جديد
                alertButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔘 تم النقر على زر الإشعارات');
                    toggleAlerts();
                });
                
                // إضافة تأثير بصري عند النقر
                alertButton.addEventListener('mousedown', function() {
                    this.style.transform = 'scale(0.95)';
                });
                
                alertButton.addEventListener('mouseup', function() {
                    this.style.transform = 'scale(1)';
                });
                
                console.log('✅ تم تسجيل مستمع الأحداث لزر الإشعارات');
            } else {
                console.error('❌ لم يتم العثور على زر الإشعارات');
            }

            // إضافة أزرار إضافية للتحكم
            const alertsPanel = document.getElementById('alertsPanel');
            if (alertsPanel) {
                alertsPanel.style.transition = 'all 0.3s ease';
                console.log('✅ تم إعداد انتقالات لوحة الإشعارات');
            }
            
            // اختبار العناصر
            testElements();
        }

        // تحميل أولي
        network.on('afterDrawing', function() {
            console.log('✅ تم رسم المخطط بنجاح!');
            
            // إعداد مستمعات الأحداث بعد تحميل الصفحة
            setTimeout(() => {
                setupEventListeners();
            }, 500);
        });

        // إعادة تموضع تلقائي بعد التحميل
        setTimeout(() => {
            resetView();
            console.log('🎉 المخطط الأمني المبسط جاهز!');
            
            // التأكد من أن أزرار التحكم تعمل
            console.log('🔧 فحص أزرار التحكم...');
            const alertsBtn = document.getElementById('alertsToggleBtn');
            if (alertsBtn) {
                console.log('✅ زر الإشعارات جاهز للاستخدام');
            } else {
                console.error('❌ تعذر العثور على زر الإشعارات عبر المعرّف');
            }
        }, 500);

        console.log('🛡️ تم تحميل المخطط الأمني بنجاح');
    </script>
</body>
</html>`;
    }
}

// تشغيل المولد
if (require.main === module) {
    const generator = new SimplifiedSecurityDiagramGenerator();
    generator.generateSimplifiedDiagram();
}

module.exports = SimplifiedSecurityDiagramGenerator;
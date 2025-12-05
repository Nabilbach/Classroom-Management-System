#!/usr/bin/env node
/**
 * خادم عرض المخطط الأمني التفاعلي المباشر
 * Live Security Dashboard Server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const HOST = 'localhost';

class DashboardServer {
    constructor() {
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;

            // إعداد CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (pathname === '/' || pathname === '/dashboard') {
                this.serveDashboard(res);
            } else if (pathname === '/api/refresh') {
                this.handleRefresh(res);
            } else if (pathname === '/api/status') {
                this.handleStatus(res);
            } else {
                this.serve404(res);
            }
        });

        this.server.listen(PORT, HOST, () => {
            console.log(`🚀 خادم المخطط الأمني يعمل على:`);
            console.log(`📡 العنوان: http://${HOST}:${PORT}`);
            console.log(`🌐 افتح هذا الرابط في المتصفح لمشاهدة المخطط التفاعلي`);
            console.log(`🔄 يتم تحديث البيانات تلقائياً كل دقيقتين`);
            console.log(`⚠️  استخدم Ctrl+C لإيقاف الخادم`);
        });

        // معالجة إيقاف الخادم
        process.on('SIGINT', () => {
            console.log('\n🛑 إيقاف خادم المخطط الأمني...');
            this.server.close(() => {
                console.log('✅ تم إيقاف الخادم بنجاح');
                process.exit(0);
            });
        });

        return `http://${HOST}:${PORT}`;
    }

    serveDashboard(res) {
        try {
            const dashboardPath = 'live_security_dashboard.html';
            
            // تحديث المخطط أولاً
            this.updateDashboard();
            
            if (fs.existsSync(dashboardPath)) {
                const content = fs.readFileSync(dashboardPath, 'utf-8');
                
                // إضافة كود التحديث التلقائي
                const enhancedContent = this.addAutoRefreshFeatures(content);
                
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
                res.end(enhancedContent);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <html dir="rtl">
                        <head><title>لم يتم العثور على المخطط</title></head>
                        <body style="font-family: Arial; text-align: center; padding: 50px;">
                            <h1>❌ لم يتم العثور على المخطط</h1>
                            <p>يرجى تشغيل مولد المخطط أولاً:</p>
                            <code>node live_security_diagram_generator.cjs</code>
                        </body>
                    </html>
                `);
            }
        } catch (error) {
            console.error('خطأ في عرض المخطط:', error);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <html dir="rtl">
                    <head><title>خطأ في الخادم</title></head>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h1>⚠️ خطأ في الخادم</h1>
                        <p>حدث خطأ أثناء تحميل المخطط</p>
                        <p>الخطأ: ${error.message}</p>
                    </body>
                </html>
            `);
        }
    }

    handleRefresh(res) {
        try {
            console.log('🔄 طلب تحديث المخطط...');
            
            // تشغيل مولد المخطط
            const { spawn } = require('child_process');
            const updateProcess = spawn('node', ['live_security_diagram_generator.cjs']);
            
            updateProcess.on('close', (code) => {
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                
                if (code === 0) {
                    res.end(JSON.stringify({
                        success: true,
                        message: 'تم تحديث المخطط بنجاح',
                        timestamp: new Date().toISOString()
                    }));
                } else {
                    res.end(JSON.stringify({
                        success: false,
                        message: 'فشل في تحديث المخطط',
                        timestamp: new Date().toISOString()
                    }));
                }
            });
            
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            }));
        }
    }

    handleStatus(res) {
        try {
            const status = {
                server: 'running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                dashboardExists: fs.existsSync('live_security_dashboard.html')
            };

            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(status, null, 2));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    serve404(res) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <html dir="rtl">
                <head><title>صفحة غير موجودة</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>404 - صفحة غير موجودة</h1>
                    <p><a href="/">العودة للمخطط الأمني</a></p>
                </body>
            </html>
        `);
    }

    updateDashboard() {
        try {
            // تشغيل مولد المخطط في الخلفية إذا لم يكن المخطط موجود
            if (!fs.existsSync('live_security_dashboard.html')) {
                const { spawn } = require('child_process');
                const updateProcess = spawn('node', ['live_security_diagram_generator.cjs'], {
                    stdio: 'inherit'
                });
            }
        } catch (error) {
            console.error('خطأ في تحديث المخطط:', error);
        }
    }

    addAutoRefreshFeatures(htmlContent) {
        // إضافة ميزات التحديث التلقائي والتفاعل مع الخادم
        const autoRefreshScript = `
        <script>
            // تحديث تلقائي محسن
            let isAutoRefreshEnabled = true;
            let refreshInterval = 30000; // 30 ثانية
            let lastUpdateTime = Date.now();

            // إضافة عدادات الوقت
            function updateTimers() {
                const timeSinceUpdate = Math.floor((Date.now() - lastUpdateTime) / 1000);
                const nextUpdate = Math.ceil((refreshInterval - (Date.now() - lastUpdateTime)) / 1000);
                
                // تحديث العداد في الواجهة
                let timerElement = document.getElementById('refresh-timer');
                if (!timerElement) {
                    timerElement = document.createElement('div');
                    timerElement.id = 'refresh-timer';
                    timerElement.style.cssText = 'position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px; font-size: 12px; z-index: 1000;';
                    document.body.appendChild(timerElement);
                }
                
                timerElement.innerHTML = \`
                    🕒 آخر تحديث: \${timeSinceUpdate}ث مضت<br>
                    ⏰ التحديث القادم: \${Math.max(0, nextUpdate)}ث
                \`;
            }

            // تحديث محسن مع إشارات بصرية
            async function enhancedRefresh() {
                if (!isAutoRefreshEnabled) return;

                console.log('🔄 تحديث البيانات...');
                
                // إضافة مؤشر التحميل
                let loadingIndicator = document.createElement('div');
                loadingIndicator.innerHTML = '🔄 جاري التحديث...';
                loadingIndicator.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; z-index: 10000; font-size: 18px;';
                document.body.appendChild(loadingIndicator);

                try {
                    // طلب تحديث من الخادم
                    const response = await fetch('/api/refresh');
                    const result = await response.json();
                    
                    if (result.success) {
                        console.log('✅ تم التحديث بنجاح');
                        lastUpdateTime = Date.now();
                        
                        // إعادة تحميل الصفحة بعد تأخير قصير
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        console.error('❌ فشل في التحديث:', result.message);
                    }
                } catch (error) {
                    console.error('❌ خطأ في التحديث:', error);
                } finally {
                    // إزالة مؤشر التحميل
                    if (loadingIndicator && loadingIndicator.parentNode) {
                        loadingIndicator.parentNode.removeChild(loadingIndicator);
                    }
                }
            }

            // بدء العدادات
            setInterval(updateTimers, 1000);
            
            // التحديث التلقائي
            setInterval(enhancedRefresh, refreshInterval);

            // إضافة أزرار التحكم
            window.addEventListener('load', function() {
                // زر تفعيل/إلغاء التحديث التلقائي
                const toggleButton = document.createElement('button');
                toggleButton.innerHTML = '⏸️ إيقاف التحديث';
                toggleButton.style.cssText = 'position: fixed; bottom: 100px; right: 30px; background: #fbbf24; border: none; border-radius: 25px; padding: 10px 20px; color: black; font-weight: bold; cursor: pointer; z-index: 1000;';
                
                toggleButton.onclick = function() {
                    isAutoRefreshEnabled = !isAutoRefreshEnabled;
                    toggleButton.innerHTML = isAutoRefreshEnabled ? '⏸️ إيقاف التحديث' : '▶️ تشغيل التحديث';
                    toggleButton.style.background = isAutoRefreshEnabled ? '#fbbf24' : '#ef4444';
                };
                
                document.body.appendChild(toggleButton);

                // زر التحديث الفوري
                const immediateRefreshButton = document.createElement('button');
                immediateRefreshButton.innerHTML = '⚡ تحديث فوري';
                immediateRefreshButton.style.cssText = 'position: fixed; bottom: 160px; right: 30px; background: #3b82f6; border: none; border-radius: 25px; padding: 10px 20px; color: white; font-weight: bold; cursor: pointer; z-index: 1000;';
                
                immediateRefreshButton.onclick = enhancedRefresh;
                
                document.body.appendChild(immediateRefreshButton);
            });

            console.log('🛡️ تم تفعيل نظام التحديث التلقائي المحسن');
        </script>
        `;

        // إدراج الكود قبل إغلاق body
        return htmlContent.replace('</body>', autoRefreshScript + '</body>');
    }
}

// تشغيل الخادم
if (require.main === module) {
    const server = new DashboardServer();
    const serverUrl = server.start();
}

module.exports = DashboardServer;
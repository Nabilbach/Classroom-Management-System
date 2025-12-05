#!/usr/bin/env node
/**
 * خادم المخطط الأمني المبسط
 * Simplified Security Dashboard Server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;

const server = http.createServer((req, res) => {
    const url = req.url;
    
    // إعداد CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (url === '/' || url === '/dashboard') {
        // عرض المخطط الأمني المبسط
        if (fs.existsSync('simplified_security_dashboard.html')) {
            const content = fs.readFileSync('simplified_security_dashboard.html', 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
        } else {
            // إنشاء المخطط إذا لم يكن موجوداً
            const SimplifiedGenerator = require('./simplified_security_diagram_generator.cjs');
            const generator = new SimplifiedGenerator();
            generator.generateSimplifiedDiagram();
            
            const content = fs.readFileSync('simplified_security_dashboard.html', 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
        }
    } else if (url === '/refresh') {
        // تحديث المخطط
        try {
            const SimplifiedGenerator = require('./simplified_security_diagram_generator.cjs');
            const generator = new SimplifiedGenerator();
            generator.generateSimplifiedDiagram();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'تم تحديث المخطط بنجاح',
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    } else {
        // 404
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <html dir="rtl">
                <head>
                    <title>صفحة غير موجودة</title>
                    <style>
                        body { font-family: Arial; text-align: center; padding: 50px; background: #1e3a8a; color: white; }
                        a { color: #60a5fa; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <h1>🚫 صفحة غير موجودة</h1>
                    <p><a href="/">🏠 العودة للمخطط الأمني</a></p>
                </body>
            </html>
        `);
    }
});

server.listen(PORT, () => {
    console.log(`🚀 خادم المخطط الأمني المبسط يعمل على:`);
    console.log(`📡 العنوان: http://localhost:${PORT}`);
    console.log(`🌲 الشجرة المتفرعة جاهزة للعرض!`);
    console.log(`🎯 المخطط يحتوي على:`);
    console.log(`   • 1 نظام أساسي`);
    console.log(`   • 3 قواعد بيانات (إنتاج، تطوير، اختبار)`);
    console.log(`   • 15 جدول (5 لكل قاعدة)`);
    console.log(`   • 4 نسخ احتياطية`);
    console.log(`   • 3 سكريپتات خطرة`);
    console.log(`   • 3 خدمات نظام`);
    console.log(`\n⚠️  استخدم Ctrl+C لإيقاف الخادم`);
});

// إيقاف صحيح
process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف خادم المخطط الأمني...');
    server.close(() => {
        console.log('✅ تم إيقاف الخادم بنجاح');
        process.exit(0);
    });
});

console.log('🔄 جاري تحضير المخطط الأمني المبسط...');
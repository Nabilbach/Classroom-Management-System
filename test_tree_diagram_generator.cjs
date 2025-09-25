#!/usr/bin/env node
/**
 * مولد المخطط المبسط لاختبار العرض
 * Simple Diagram Generator for Testing Display
 */

const fs = require('fs');
const path = require('path');

class SimpleDiagramGenerator {
    constructor() {
        this.colors = {
            safe: '#22c55e',      // أخضر فاتح
            warning: '#f59e0b',   // برتقالي
            danger: '#ef4444',    // أحمر
            info: '#3b82f6',      // أزرق
            neutral: '#6b7280',   // رمادي
            database: '#8b5cf6',  // بنفسجي
            table: '#06b6d4'      // سماوي
        };
    }

    /**
     * إنشاء بيانات اختبار مبسطة
     */
    createTestData() {
        const nodes = [];
        const edges = [];

        // النظام الأساسي في المركز
        nodes.push({
            id: 'system',
            label: 'نظام إدارة الفصول',
            color: this.colors.info,
            size: 30,
            x: 0,
            y: 0,
            physics: false
        });

        // قواعد البيانات الثلاث
        const databases = [
            { id: 'db_main', name: 'classroom.db', angle: 0 },
            { id: 'db_dev', name: 'classroom_dev.db', angle: 120 },
            { id: 'db_test', name: 'classroom_test.db', angle: 240 }
        ];

        databases.forEach(db => {
            const x = Math.cos(db.angle * Math.PI / 180) * 150;
            const y = Math.sin(db.angle * Math.PI / 180) * 150;
            
            nodes.push({
                id: db.id,
                label: db.name,
                color: this.colors.database,
                size: 25,
                x: x,
                y: y,
                physics: false
            });

            // ربط بالنظام الأساسي
            edges.push({
                from: 'system',
                to: db.id,
                color: this.colors.info,
                width: 3
            });

            // إضافة جداول لكل قاعدة بيانات
            const tables = ['students', 'teachers', 'sections', 'subjects'];
            
            tables.forEach((table, index) => {
                const tableAngle = db.angle + ((index - 1.5) * 20);
                const tableX = x + Math.cos(tableAngle * Math.PI / 180) * 80;
                const tableY = y + Math.sin(tableAngle * Math.PI / 180) * 80;
                const tableId = `${db.id}_${table}`;
                
                nodes.push({
                    id: tableId,
                    label: table,
                    color: this.colors.table,
                    size: 15,
                    x: tableX,
                    y: tableY,
                    physics: false
                });

                // ربط الجدول بقاعدة البيانات
                edges.push({
                    from: db.id,
                    to: tableId,
                    color: this.colors.neutral,
                    width: 1
                });
            });
        });

        return { nodes, edges };
    }

    /**
     * إنشاء HTML للمخطط
     */
    generateHTML() {
        const data = this.createTestData();
        
        const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مخطط اختبار الشجرة المتفرعة</title>
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%);
            color: white;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            height: 80vh;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        h1 {
            text-align: center;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        #networkGraph {
            width: 100%;
            height: calc(100% - 60px);
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }

        .info {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            padding: 15px;
            border-radius: 10px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="info">
        <strong>العقد المتوقعة:</strong><br>
        • النظام الأساسي: 1<br>
        • قواعد البيانات: 3<br>
        • الجداول: 12<br>
        <strong>المجموع: 16 عقدة</strong>
    </div>

    <div class="container">
        <h1>🌲 اختبار الشجرة المتفرعة</h1>
        <div id="networkGraph"></div>
    </div>

    <script>
        console.log('🚀 بدء تحميل المخطط...');
        
        // البيانات
        const nodes = new vis.DataSet(${JSON.stringify(data.nodes, null, 2)});
        const edges = new vis.DataSet(${JSON.stringify(data.edges, null, 2)});

        console.log('📊 عدد العقد:', nodes.length);
        console.log('🔗 عدد الاتصالات:', edges.length);

        // إعدادات المخطط
        const options = {
            nodes: {
                shape: 'dot',
                font: {
                    size: 12,
                    color: 'white',
                    face: 'Arial'
                },
                borderWidth: 2,
                borderColor: 'white',
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.3)',
                    size: 5,
                    x: 2,
                    y: 2
                }
            },
            edges: {
                color: {
                    color: '#ffffff',
                    highlight: '#ffff00'
                },
                width: 2,
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
                hover: true
            }
        };

        // إنشاء المخطط
        const container = document.getElementById('networkGraph');
        const network = new vis.Network(container, { nodes, edges }, options);

        // أحداث
        network.on('click', function(params) {
            console.log('تم النقر على:', params);
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = nodes.get(nodeId);
                alert('العقدة: ' + node.label + '\\nالمعرف: ' + node.id);
            }
        });

        network.on('afterDrawing', function() {
            console.log('✅ تم رسم المخطط بنجاح!');
        });

        // تحقق من التحميل
        setTimeout(() => {
            const allNodes = nodes.get();
            const allEdges = edges.get();
            console.log('🎯 العقد المحملة:', allNodes.length);
            console.log('🔗 الاتصالات المحملة:', allEdges.length);
            
            if (allNodes.length === 0) {
                document.getElementById('networkGraph').innerHTML = 
                    '<div style="padding: 50px; text-align: center; color: red; font-size: 18px;">' +
                    '❌ لا توجد بيانات للعرض!<br>تحقق من وحدة التحكم للأخطاء.' +
                    '</div>';
            }
        }, 1000);

        console.log('🎉 تم تحميل المخطط الاختباري!');
    </script>
</body>
</html>`;

        return html;
    }

    /**
     * حفظ المخطط الاختباري
     */
    save() {
        const html = this.generateHTML();
        const filename = 'test_tree_diagram.html';
        
        fs.writeFileSync(filename, html);
        
        console.log(`✅ تم إنشاء المخطط الاختباري: ${filename}`);
        console.log('📊 يحتوي على:');
        console.log('   • 1 نظام أساسي');
        console.log('   • 3 قواعد بيانات');
        console.log('   • 12 جدول (4 لكل قاعدة)');
        console.log('   • 15 اتصال');
        console.log('\n🌐 افتح الملف في المتصفح لمشاهدة الشجرة');
        
        return filename;
    }
}

// تشغيل المولد
if (require.main === module) {
    const generator = new SimpleDiagramGenerator();
    generator.save();
}

module.exports = SimpleDiagramGenerator;
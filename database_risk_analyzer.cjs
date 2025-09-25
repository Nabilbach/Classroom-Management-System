#!/usr/bin/env node
/**
 * محلل مخاطر سكريبتات قاعدة البيانات
 * يفحص جميع السكريبتات ويحدد مستوى الخطر لكل منها
 */

const fs = require('fs');
const path = require('path');

class DatabaseScriptRiskAnalyzer {
    constructor() {
        this.risks = {
            CRITICAL: [],
            HIGH: [],
            MEDIUM: [],
            LOW: []
        };

        // أنماط الكود الخطرة
        this.dangerousPatterns = {
            CRITICAL: [
                /\.drop\(\)/g,                           // حذف كامل للجداول
                /DROP\s+TABLE/gi,                        // أمر حذف جدول SQL
                /DELETE\s+FROM\s+\w+\s*;?\s*$/gmi,      // حذف جميع البيانات
                /TRUNCATE/gi                             // مسح محتويات جدول
            ],
            HIGH: [
                /\.destroy\(\s*\{/g,                     // حذف بيانات محددة
                /removeColumn/g,                         // حذف عمود من جدول
                /ALTER\s+TABLE.*DROP/gi,                 // تعديل جدول بحذف
                /\.update\(\s*\{.*\}\s*,\s*\{\s*where:\s*\{\s*\}\s*\}\s*\)/g // تحديث بدون شروط
            ],
            MEDIUM: [
                /\.create\(/g,                           // إنشاء بيانات جديدة
                /\.update\(/g,                           // تحديث بيانات
                /addColumn/g,                            // إضافة عمود جديد
                /Date\.now\(\)\.toString\(\)/g          // استخدام تاريخ كمعرف
            ],
            LOW: [
                /console\.log/g,                         // طباعة قد تكشف بيانات حساسة
                /\.findAll\(\)/g,                        // جلب جميع البيانات
                /process\.exit/g                         // إنهاء العملية
            ]
        };

        // كلمات مفتاحية تدل على المخاطر
        this.riskKeywords = {
            CRITICAL: ['reset', 'drop', 'delete_all', 'truncate', 'wipe'],
            HIGH: ['migrate', 'alter', 'destroy', 'remove', 'fix'],
            MEDIUM: ['repair', 'update', 'create', 'restore'],
            LOW: ['check', 'test', 'analyze', 'inspect']
        };

        // أسماء ملفات خطرة
        this.dangerousFiles = {
            CRITICAL: ['reset', 'drop', 'clear', 'wipe'],
            HIGH: ['migrate', 'alter', 'destroy'],
            MEDIUM: ['repair', 'fix', 'restore', 'update'],
            LOW: ['check', 'test', 'analyze']
        };
    }

    /**
     * تحليل ملف سكريبت واحد
     */
    analyzeScript(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const fileName = path.basename(filePath, path.extname(filePath));
            
            const analysis = {
                file: filePath,
                fileName: fileName,
                riskLevel: 'LOW',
                risks: [],
                patterns: [],
                recommendations: []
            };

            // فحص الأنماط الخطرة
            for (const [level, patterns] of Object.entries(this.dangerousPatterns)) {
                for (const pattern of patterns) {
                    const matches = content.match(pattern);
                    if (matches) {
                        analysis.patterns.push({
                            level: level,
                            pattern: pattern.toString(),
                            matches: matches.length,
                            examples: matches.slice(0, 3) // أول 3 مطابقات فقط
                        });
                        
                        // تحديد مستوى الخطر الأعلى
                        if (this.isHigherRisk(level, analysis.riskLevel)) {
                            analysis.riskLevel = level;
                        }
                    }
                }
            }

            // فحص الكلمات المفتاحية في اسم الملف
            for (const [level, keywords] of Object.entries(this.riskKeywords)) {
                for (const keyword of keywords) {
                    if (fileName.toLowerCase().includes(keyword)) {
                        analysis.risks.push(`اسم الملف يحتوي على كلمة خطرة: ${keyword}`);
                        if (this.isHigherRisk(level, analysis.riskLevel)) {
                            analysis.riskLevel = level;
                        }
                    }
                }
            }

            // توصيات حسب مستوى الخطر
            this.addRecommendations(analysis);

            return analysis;
            
        } catch (error) {
            console.error(`❌ خطأ في تحليل الملف ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * تحديد ما إذا كان المستوى أعلى خطراً
     */
    isHigherRisk(newLevel, currentLevel) {
        const levels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
        return levels[newLevel] > levels[currentLevel];
    }

    /**
     * إضافة التوصيات حسب مستوى الخطر
     */
    addRecommendations(analysis) {
        switch (analysis.riskLevel) {
            case 'CRITICAL':
                analysis.recommendations.push('🚨 خذ نسخة احتياطية قبل التشغيل');
                analysis.recommendations.push('🚨 اختبر في بيئة تطوير أولاً');
                analysis.recommendations.push('🚨 أضف تأكيد يدوي قبل التنفيذ');
                analysis.recommendations.push('🚨 راجع الكود مع فريق آخر');
                break;
            case 'HIGH':
                analysis.recommendations.push('⚠️ خذ نسخة احتياطية');
                analysis.recommendations.push('⚠️ اختبر في بيئة منفصلة');
                analysis.recommendations.push('⚠️ أضف تسجيل للعمليات');
                break;
            case 'MEDIUM':
                analysis.recommendations.push('🟡 راجع التغييرات قبل التشغيل');
                analysis.recommendations.push('🟡 أضف آلية للتراجع');
                break;
            case 'LOW':
                analysis.recommendations.push('ℹ️ مراقبة استهلاك الموارد');
                break;
        }
    }

    /**
     * فحص مجلد بحثاً عن السكريبتات
     */
    async scanDirectory(dirPath = '.') {
        const scriptFiles = [];
        
        // البحث عن ملفات JavaScript/CJS
        const findScripts = (dir) => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    findScripts(fullPath);
                } else if (stat.isFile() && /\.(js|cjs)$/.test(item)) {
                    // تركيز على ملفات الصيانة والإدارة
                    const suspiciousNames = [
                        'reset', 'drop', 'clear', 'wipe', 'delete',
                        'migrate', 'alter', 'destroy', 'remove',
                        'repair', 'fix', 'restore', 'update', 'import',
                        'check', 'test', 'analyze', 'inspect'
                    ];
                    
                    if (suspiciousNames.some(name => item.toLowerCase().includes(name))) {
                        scriptFiles.push(fullPath);
                    }
                }
            }
        };

        findScripts(dirPath);
        return scriptFiles;
    }

    /**
     * تشغيل التحليل الكامل
     */
    async runAnalysis(directory = '.') {
        console.log('🔍 بدء تحليل مخاطر سكريبتات قاعدة البيانات...\n');
        
        try {
            const scriptFiles = await this.scanDirectory(directory);
            console.log(`📊 تم العثور على ${scriptFiles.length} ملف سكريبت للفحص\n`);

            const results = [];
            
            for (const file of scriptFiles) {
                const analysis = this.analyzeScript(file);
                if (analysis) {
                    results.push(analysis);
                    this.risks[analysis.riskLevel].push(analysis);
                }
            }

            this.generateReport(results);
            
        } catch (error) {
            console.error('❌ فشل التحليل:', error);
        }
    }

    /**
     * إنتاج تقرير مفصل
     */
    generateReport(results) {
        console.log('📋 تقرير تحليل المخاطر');
        console.log('='.repeat(50));

        // إحصائيات عامة
        const stats = {
            CRITICAL: this.risks.CRITICAL.length,
            HIGH: this.risks.HIGH.length,
            MEDIUM: this.risks.MEDIUM.length,
            LOW: this.risks.LOW.length
        };

        console.log('\n📊 الإحصائيات:');
        console.log(`🔴 خطر حرج: ${stats.CRITICAL} ملف`);
        console.log(`🟠 خطر عالي: ${stats.HIGH} ملف`);
        console.log(`🟡 خطر متوسط: ${stats.MEDIUM} ملف`);
        console.log(`🟢 خطر منخفض: ${stats.LOW} ملف`);

        // تفاصيل المخاطر الحرجة والعالية
        if (this.risks.CRITICAL.length > 0) {
            console.log('\n🚨 ملفات الخطر الحرج:');
            this.risks.CRITICAL.forEach(risk => {
                console.log(`\n❌ ${risk.fileName}`);
                console.log(`   المسار: ${risk.file}`);
                risk.patterns.forEach(pattern => {
                    console.log(`   🔍 نمط خطر: ${pattern.examples[0]} (${pattern.matches} مرة)`);
                });
                console.log(`   💡 التوصيات: ${risk.recommendations.join(', ')}`);
            });
        }

        if (this.risks.HIGH.length > 0) {
            console.log('\n⚠️ ملفات الخطر العالي:');
            this.risks.HIGH.forEach(risk => {
                console.log(`\n🟠 ${risk.fileName}`);
                console.log(`   المسار: ${risk.file}`);
                if (risk.patterns.length > 0) {
                    console.log(`   🔍 أنماط خطرة: ${risk.patterns.length}`);
                }
            });
        }

        // توصيات عامة
        console.log('\n💡 التوصيات العامة:');
        console.log('1. أنشئ نظام نسخ احتياطية تلقائية');
        console.log('2. أضف بيئة تطوير منفصلة للاختبار');
        console.log('3. استخدم متغيرات البيئة لمنع تشغيل سكريبتات خطرة في الإنتاج');
        console.log('4. أضف آلية تأكيد للسكريبتات الحرجة');
        console.log('5. سجل جميع عمليات تعديل قاعدة البيانات');

        // حفظ التقرير في ملف
        this.saveReport(results);
    }

    /**
     * حفظ التقرير في ملف JSON
     */
    saveReport(results) {
        const reportData = {
            timestamp: new Date().toISOString(),
            totalScripts: results.length,
            riskDistribution: {
                CRITICAL: this.risks.CRITICAL.length,
                HIGH: this.risks.HIGH.length,
                MEDIUM: this.risks.MEDIUM.length,
                LOW: this.risks.LOW.length
            },
            results: results
        };

        const reportPath = 'database_scripts_risk_report.json';
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
        console.log(`\n💾 تم حفظ التقرير المفصل في: ${reportPath}`);
    }
}

// تشغيل التحليل
if (require.main === module) {
    const analyzer = new DatabaseScriptRiskAnalyzer();
    analyzer.runAnalysis();
}

module.exports = DatabaseScriptRiskAnalyzer;
const { AdminScheduleEntry } = require('../../backend/models');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DAY_MAP = {
    'Monday': 'الإثنين',
    'Tuesday': 'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس',
    'Friday': 'الجمعة',
    'Saturday': 'السبت',
    'Sunday': 'الأحد'
};

// 🛡️ نظام حماية تصحيح الجدول - Schedule Fix Protection System
class ScheduleFixProtection {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async checkEnvironment() {
        if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SCHEDULE_FIX) {
            console.log('🚫 تحذير: تصحيح الجدول في بيئة الإنتاج محظور');
            console.log('💡 للسماح بالتصحيح: set ALLOW_SCHEDULE_FIX=true');
            process.exit(1);
        }
        console.log('✅ فحص البيئة: مسموح');
    }

    async createBackup() {
        console.log('📦 إنشاء نسخة احتياطية...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.resolve(__dirname, `../../pre_schedule_fix_${timestamp}.db`);
        const dbPath = process.env.NODE_ENV === 'production' ? 'classroom.db' :
            process.env.NODE_ENV === 'test' ? 'classroom_test.db' : 'classroom_dev.db';
        const dbFullPath = path.resolve(__dirname, '../../', dbPath);

        if (fs.existsSync(dbFullPath)) {
            fs.copyFileSync(dbFullPath, backupPath);
            console.log(`✅ نسخة احتياطية: ${backupPath}`);
        }
    }

    async confirmOperation() {
        console.log('\n⚠️ هذا السكريبت سيقوم بـ:');
        console.log('1. تحديث أسماء الأيام من الإنجليزية إلى العربية');
        console.log('2. تعديل جدول المواعيد الإدارية');

        const answer = await this.askQuestion('\n✅ هل تريد المتابعة؟ (نعم/لا): ');

        if (answer.trim() !== 'نعم') {
            console.log('❌ تم إلغاء العملية');
            this.rl.close();
            process.exit(0);
        }

        console.log('✅ تم التأكيد');
    }

    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    close() {
        this.rl.close();
    }
}

async function fixScheduleDays() {
    const protection = new ScheduleFixProtection();

    try {
        console.log('🛡️ بدء فحوصات الأمان...\n');

        await protection.checkEnvironment();
        await protection.createBackup();
        await protection.confirmOperation();

        console.log('\n🔄 بدء تصحيح أسماء الأيام في الجدول الزمني...');

        const entries = await AdminScheduleEntry.findAll();
        console.log(`📊 تم العثور على ${entries.length} جلسة`);

        let updatedCount = 0;

        for (const entry of entries) {
            const currentDay = entry.day;
            const arabicDay = DAY_MAP[currentDay];

            if (arabicDay && arabicDay !== currentDay) {
                await entry.update({ day: arabicDay });
                console.log(`✅ تم تحديث: ${currentDay} → ${arabicDay}`);
                updatedCount++;
            } else if (!arabicDay) {
                console.log(`⚠️ يوم غير معروف: ${currentDay}`);
            }
        }

        console.log(`📊 تم تحديث ${updatedCount} جلسة`);
        console.log('✅ تم تصحيح أسماء الأيام بنجاح!');

    } catch (error) {
        console.error('❌ خطأ في تصحيح أسماء الأيام:', error);
        throw error;
    } finally {
        protection.close();
    }
}

// تشغيل السكريبت
fixScheduleDays()
    .then(() => {
        console.log('🎉 انتهت عملية التصحيح');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ فشل في تصحيح أسماء الأيام:', error);
        process.exit(1);
    });

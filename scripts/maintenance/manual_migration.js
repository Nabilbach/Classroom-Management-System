const { DataTypes } = require('sequelize');
const sequelize = require('../../backend/config/database');
const Section = require('../../backend/models/section');
const AdministrativeTimetableEntry = require('../../backend/models/administrativeTimetableEntry');
const fs = require('fs');
const path = require('path');

// 🛡️ نظام حماية الترحيل - Migration Protection System
class MigrationProtection {
    constructor() {
        this.backupPath = null;
    }

    async checkEnvironment() {
        // منع في الإنتاج بدون متغير خاص
        if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PRODUCTION_MIGRATION) {
            console.log('🚫 تحذير: ترحيل قاعدة البيانات في بيئة الإنتاج محظور');
            console.log('💡 للسماح بالترحيل في الإنتاج: set ALLOW_PRODUCTION_MIGRATION=true');
            process.exit(1);
        }

        console.log('✅ فحص البيئة: مسموح بالترحيل');
    }

    async createPreMigrationBackup() {
        console.log('📦 إنشاء نسخة احتياطية قبل الترحيل...');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.backupPath = path.resolve(__dirname, `../../pre_migration_backup_${timestamp}.db`);

        // نسخ قاعدة البيانات الحالية
        const dbPath = process.env.NODE_ENV === 'production' ? 'classroom.db' :
            process.env.NODE_ENV === 'test' ? 'classroom_test.db' : 'classroom_dev.db';

        const dbFullPath = path.resolve(__dirname, '../../', dbPath);

        if (fs.existsSync(dbFullPath)) {
            fs.copyFileSync(dbFullPath, this.backupPath);
            console.log(`✅ تم إنشاء نسخة احتياطية: ${this.backupPath}`);
        } else {
            console.log('⚠️ لم يتم العثور على قاعدة البيانات للنسخ الاحتياطي');
        }
    }

    async logMigrationStart() {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation: 'MANUAL_MIGRATION_START',
            environment: process.env.NODE_ENV || 'unknown',
            user: process.env.USERNAME || 'unknown',
            backupCreated: this.backupPath
        };

        const logPath = path.resolve(__dirname, '../../security_audit.log');
        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
        console.log('📝 تم تسجيل بداية الترحيل');
    }

    async logMigrationEnd(success, error = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation: 'MANUAL_MIGRATION_END',
            success: success,
            error: error?.message || null,
            backupPath: this.backupPath
        };

        const logPath = path.resolve(__dirname, '../../security_audit.log');
        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

        if (success) {
            console.log('✅ تم تسجيل نجاح الترحيل');
        } else {
            console.log('❌ تم تسجيل فشل الترحيل');
            console.log(`🔄 يمكن الاستعادة من: ${this.backupPath}`);
        }
    }
}

const migrate = async () => {
    const protection = new MigrationProtection();
    const queryInterface = sequelize.getQueryInterface();

    try {
        console.log('🛡️ بدء فحوصات الأمان للترحيل...\n');

        // فحص البيئة
        await protection.checkEnvironment();

        // إنشاء نسخة احتياطية
        await protection.createPreMigrationBackup();

        // تسجيل بداية الترحيل
        await protection.logMigrationStart();

        console.log('\n🔄 بدء عملية الترحيل...');
        // Add sectionId column if it doesn't exist
        const tableDescription = await queryInterface.describeTable('administrative_timetable');
        if (!tableDescription.sectionId) {
            await queryInterface.addColumn('administrative_timetable', 'sectionId', {
                type: DataTypes.STRING,
                allowNull: true, // Allow null temporarily
            });
        }

        // Get all sections and create a map of name to id
        const sections = await Section.findAll();
        const sectionMap = new Map();
        sections.forEach(section => {
            sectionMap.set(section.name, section.id);
        });

        // Get all timetable entries
        const timetableEntries = await AdministrativeTimetableEntry.findAll();

        // Update sectionId for each entry
        for (const entry of timetableEntries) {
            const sectionId = sectionMap.get(entry.sectionName);
            if (sectionId) {
                await entry.update({ sectionId });
            }
        }

        // Delete orphaned entries
        await AdministrativeTimetableEntry.destroy({
            where: {
                sectionId: null
            }
        });

        // Make sectionId not nullable
        await queryInterface.changeColumn('administrative_timetable', 'sectionId', {
            type: DataTypes.STRING,
            allowNull: false,
        });

        // Remove sectionName column
        await queryInterface.removeColumn('administrative_timetable', 'sectionName');

        console.log('✅ Migration completed successfully!');
        await protection.logMigrationEnd(true);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await protection.logMigrationEnd(false, error);

        // في حالة الفشل، إرشادات الاستعادة
        console.log('\n🆘 إرشادات الاستعادة:');
        console.log(`1. أوقف جميع الخدمات`);
        console.log(`2. استعد النسخة الاحتياطية: ${protection.backupPath}`);
        console.log(`3. أعد تشغيل النظام`);

    } finally {
        await sequelize.close();
    }
};

// تشغيل مع الحماية
migrate();

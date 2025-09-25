const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

/**
 * نظام تقوية قاعدة البيانات وإضافة آليات الحماية
 * Database Hardening & Protection System
 */

class DatabaseHardening {
    constructor(dbPath = 'classroom.db') {
        this.dbPath = dbPath;
        this.db = null;
    }

    // فتح اتصال قاعدة البيانات
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
                    reject(err);
                } else {
                    console.log('✅ تم الاتصال بقاعدة البيانات');
                    // تفعيل Foreign Keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
    }

    // إغلاق الاتصال
    close() {
        if (this.db) {
            this.db.close();
        }
    }

    // تشغيل استعلام مع Promise
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // جلب البيانات مع Promise
    getAllQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // إنشاء نسخة احتياطية قبل التطبيق
    async createPreHardeningBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `pre_hardening_backup_${timestamp}.db`;
        
        try {
            if (!fs.existsSync('backups')) {
                fs.mkdirSync('backups', { recursive: true });
            }
            
            fs.copyFileSync(this.dbPath, `backups/${backupName}`);
            console.log(`💾 تم إنشاء نسخة احتياطية: backups/${backupName}`);
            return backupName;
        } catch (error) {
            console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
            throw error;
        }
    }

    // فحص الجداول الموجودة
    async checkExistingTables() {
        const query = `
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `;
        
        const tables = await this.getAllQuery(query);
        console.log('📋 الجداول الموجودة:', tables.map(t => t.name).join(', '));
        return tables.map(t => t.name);
    }

    // فحص الفهارس الموجودة
    async checkExistingIndexes() {
        const query = `
            SELECT name, sql FROM sqlite_master 
            WHERE type='index' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `;
        
        const indexes = await this.getAllQuery(query);
        console.log('🔍 الفهارس الموجودة:', indexes.length);
        return indexes;
    }

    // فحص الـ Triggers الموجودة
    async checkExistingTriggers() {
        const query = `
            SELECT name, sql FROM sqlite_master 
            WHERE type='trigger'
            ORDER BY name
        `;
        
        const triggers = await this.getAllQuery(query);
        console.log('⚡ الـ Triggers الموجودة:', triggers.length);
        return triggers;
    }

    // إضافة Foreign Key Constraints (إذا لم تكن موجودة)
    async addForeignKeyConstraints() {
        console.log('🔗 إضافة Foreign Key Constraints...');
        
        try {
            // فحص بنية الجداول أولاً
            const tablesInfo = await this.getAllQuery(`
                SELECT sql FROM sqlite_master 
                WHERE type='table' AND name IN ('ScheduledLessons', 'TextbookEntries', 'Attendances')
            `);
            
            console.log('📋 فحص بنية الجداول...');
            
            // التحقق من وجود العمود scheduled_lesson_id في TextbookEntries
            const textbookColumns = await this.getAllQuery("PRAGMA table_info('TextbookEntries')");
            const hasScheduledLessonId = textbookColumns.some(col => col.name === 'scheduled_lesson_id');
            
            if (!hasScheduledLessonId) {
                console.log('➕ إضافة عمود scheduled_lesson_id إلى TextbookEntries...');
                await this.runQuery(`
                    ALTER TABLE TextbookEntries 
                    ADD COLUMN scheduled_lesson_id INTEGER REFERENCES ScheduledLessons(id)
                `);
            } else {
                console.log('✅ العمود scheduled_lesson_id موجود بالفعل');
            }
            
            // إنشاء فهارس لتحسين الأداء
            console.log('📊 إنشاء فهارس لتحسين الأداء...');
            
            const indexes = [
                {
                    name: 'idx_textbook_scheduled_lesson',
                    sql: 'CREATE INDEX IF NOT EXISTS idx_textbook_scheduled_lesson ON TextbookEntries(scheduled_lesson_id)'
                },
                {
                    name: 'idx_scheduled_lessons_date',
                    sql: 'CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_date ON ScheduledLessons(date)'
                },
                {
                    name: 'idx_attendances_date_section',
                    sql: 'CREATE INDEX IF NOT EXISTS idx_attendances_date_section ON Attendances(date, section_id)'
                },
                {
                    name: 'idx_textbook_date',
                    sql: 'CREATE INDEX IF NOT EXISTS idx_textbook_date ON TextbookEntries(date)'
                }
            ];
            
            for (const index of indexes) {
                await this.runQuery(index.sql);
                console.log(`✅ تم إنشاء الفهرس: ${index.name}`);
            }
            
        } catch (error) {
            console.error('❌ خطأ في إضافة Foreign Key Constraints:', error);
            throw error;
        }
    }

    // إنشاء Triggers للحماية التلقائية
    async createProtectionTriggers() {
        console.log('⚡ إنشاء Triggers للحماية التلقائية...');
        
        const triggers = [
            // Trigger لإنشاء TextbookEntry تلقائياً عند إنشاء ScheduledLesson
            {
                name: 'auto_create_textbook_entry',
                sql: `
                CREATE TRIGGER IF NOT EXISTS auto_create_textbook_entry
                AFTER INSERT ON ScheduledLessons
                BEGIN
                    INSERT INTO TextbookEntries (
                        scheduled_lesson_id,
                        date,
                        subject_id,
                        section_id,
                        lesson_content,
                        objectives,
                        activities,
                        homework,
                        notes,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        NEW.date,
                        NEW.subject_id,
                        NEW.section_id,
                        COALESCE(NEW.lesson_title, 'محتوى الدرس') || ' - ' || NEW.date,
                        'أهداف الدرس: ' || COALESCE(NEW.lesson_title, 'غير محدد'),
                        'الأنشطة والطرق المستخدمة في الدرس',
                        'واجبات وتقويمات الدرس',
                        'ملاحظات المعلم حول سير الدرس',
                        datetime('now'),
                        datetime('now')
                    );
                END
                `
            },
            
            // Trigger لمنع حذف ScheduledLessons إذا كانت لها TextbookEntries
            {
                name: 'prevent_orphan_textbook_entries',
                sql: `
                CREATE TRIGGER IF NOT EXISTS prevent_orphan_textbook_entries
                BEFORE DELETE ON ScheduledLessons
                BEGIN
                    SELECT CASE
                        WHEN EXISTS(
                            SELECT 1 FROM TextbookEntries 
                            WHERE scheduled_lesson_id = OLD.id
                        )
                        THEN RAISE(ABORT, 'لا يمكن حذف الحصة لوجود إدخالات مرتبطة في دفتر النصوص')
                    END;
                END
                `
            },
            
            // Trigger لتحديث updated_at تلقائياً في TextbookEntries
            {
                name: 'auto_update_textbook_timestamp',
                sql: `
                CREATE TRIGGER IF NOT EXISTS auto_update_textbook_timestamp
                AFTER UPDATE ON TextbookEntries
                BEGIN
                    UPDATE TextbookEntries 
                    SET updated_at = datetime('now')
                    WHERE id = NEW.id;
                END
                `
            },
            
            // Trigger لتسجيل التغييرات المهمة في جدول الـ Audit
            {
                name: 'audit_scheduled_lessons_changes',
                sql: `
                CREATE TRIGGER IF NOT EXISTS audit_scheduled_lessons_changes
                AFTER UPDATE ON ScheduledLessons
                BEGIN
                    INSERT OR IGNORE INTO audit_log (
                        table_name,
                        record_id,
                        action_type,
                        old_values,
                        new_values,
                        timestamp
                    ) VALUES (
                        'ScheduledLessons',
                        NEW.id,
                        'UPDATE',
                        json_object(
                            'date', OLD.date,
                            'lesson_title', OLD.lesson_title,
                            'subject_id', OLD.subject_id,
                            'section_id', OLD.section_id
                        ),
                        json_object(
                            'date', NEW.date,
                            'lesson_title', NEW.lesson_title,
                            'subject_id', NEW.subject_id,
                            'section_id', NEW.section_id
                        ),
                        datetime('now')
                    );
                END
                `
            }
        ];
        
        for (const trigger of triggers) {
            try {
                await this.runQuery(trigger.sql);
                console.log(`✅ تم إنشاء الـ Trigger: ${trigger.name}`);
            } catch (error) {
                console.error(`❌ خطأ في إنشاء ${trigger.name}:`, error.message);
                // لا نتوقف، نحاول المتبقي
            }
        }
    }

    // إنشاء جدول Audit Log إذا لم يكن موجود
    async createAuditLogTable() {
        console.log('📊 إنشاء جدول Audit Log...');
        
        const createAuditTable = `
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id INTEGER,
            action_type TEXT NOT NULL, -- INSERT, UPDATE, DELETE
            old_values TEXT, -- JSON format
            new_values TEXT, -- JSON format
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT DEFAULT 'system'
        )
        `;
        
        try {
            await this.runQuery(createAuditTable);
            
            // إنشاء فهرس على جدول الـ Audit
            await this.runQuery(`
                CREATE INDEX IF NOT EXISTS idx_audit_log_table_record 
                ON audit_log(table_name, record_id)
            `);
            
            await this.runQuery(`
                CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp 
                ON audit_log(timestamp)
            `);
            
            console.log('✅ تم إنشاء جدول Audit Log بنجاح');
        } catch (error) {
            console.error('❌ خطأ في إنشاء جدول Audit Log:', error);
            throw error;
        }
    }

    // إنشاء Views مفيدة للمراقبة
    async createMonitoringViews() {
        console.log('👁️ إنشاء Views للمراقبة...');
        
        const views = [
            // View للتحقق من التطابق
            {
                name: 'data_consistency_view',
                sql: `
                CREATE VIEW IF NOT EXISTS data_consistency_view AS
                SELECT 
                    sl.id as lesson_id,
                    sl.date,
                    sl.lesson_title,
                    sl.subject_id,
                    sl.section_id,
                    COUNT(te.id) as textbook_entries_count,
                    COUNT(DISTINCT a.student_id) as students_with_attendance,
                    CASE 
                        WHEN COUNT(te.id) = 0 THEN 'مفقود: إدخال دفتر النصوص'
                        WHEN COUNT(te.id) > 1 THEN 'مكرر: إدخالات دفتر النصوص'
                        WHEN COUNT(DISTINCT a.student_id) = 0 THEN 'مفقود: سجلات الحضور'
                        ELSE 'متطابق'
                    END as consistency_status
                FROM ScheduledLessons sl
                LEFT JOIN TextbookEntries te ON sl.id = te.scheduled_lesson_id
                LEFT JOIN Attendances a ON sl.date = a.date AND sl.section_id = a.section_id
                GROUP BY sl.id, sl.date, sl.lesson_title, sl.subject_id, sl.section_id
                ORDER BY sl.date DESC
                `
            },
            
            // View لملخص النشاط اليومي
            {
                name: 'daily_activity_summary',
                sql: `
                CREATE VIEW IF NOT EXISTS daily_activity_summary AS
                SELECT 
                    date,
                    COUNT(DISTINCT sl.id) as scheduled_lessons,
                    COUNT(DISTINCT te.id) as textbook_entries,
                    COUNT(DISTINCT a.date || '-' || a.section_id) as attendance_sessions,
                    COUNT(DISTINCT a.student_id) as unique_students_present
                FROM ScheduledLessons sl
                LEFT JOIN TextbookEntries te ON sl.date = te.date
                LEFT JOIN Attendances a ON sl.date = a.date
                GROUP BY date
                ORDER BY date DESC
                `
            }
        ];
        
        for (const view of views) {
            try {
                await this.runQuery(view.sql);
                console.log(`✅ تم إنشاء الـ View: ${view.name}`);
            } catch (error) {
                console.error(`❌ خطأ في إنشاء ${view.name}:`, error.message);
            }
        }
    }

    // تطبيق جميع التحسينات
    async applyAllHardening() {
        console.log('🛡️ بدء عملية تقوية قاعدة البيانات...\n');
        
        try {
            // 1. إنشاء نسخة احتياطية
            await this.createPreHardeningBackup();
            
            // 2. الاتصال بقاعدة البيانات
            await this.connect();
            
            // 3. فحص الوضع الحالي
            console.log('\n🔍 فحص الوضع الحالي...');
            const tables = await this.checkExistingTables();
            const indexes = await this.checkExistingIndexes();
            const triggers = await this.checkExistingTriggers();
            
            // 4. إنشاء جدول Audit Log
            await this.createAuditLogTable();
            
            // 5. إضافة Foreign Key Constraints والفهارس
            await this.addForeignKeyConstraints();
            
            // 6. إنشاء Protection Triggers
            await this.createProtectionTriggers();
            
            // 7. إنشاء Monitoring Views
            await this.createMonitoringViews();
            
            console.log('\n✅ تم تطبيق جميع تحسينات الحماية بنجاح!');
            console.log('🛡️ قاعدة البيانات محمية الآن ضد:');
            console.log('   • فقدان البيانات غير المتطابقة');
            console.log('   • حذف البيانات المرتبطة');
            console.log('   • عدم إنشاء إدخالات دفتر النصوص');
            console.log('   • فقدان سجلات التعديلات');
            
        } catch (error) {
            console.error('❌ خطأ في تطبيق التحسينات:', error);
            throw error;
        } finally {
            this.close();
        }
    }

    // اختبار النظام الجديد
    async testNewSystem() {
        console.log('\n🧪 اختبار النظام المحدود...');
        
        try {
            await this.connect();
            
            // اختبار إدراج حصة جديدة
            console.log('📝 اختبار إدراج حصة جديدة...');
            const testLesson = {
                date: '2025-09-30',
                lesson_title: 'اختبار النظام الجديد',
                subject_id: 1,
                section_id: 1,
                teacher_id: 1,
                period: 1,
                status: 'scheduled'
            };
            
            const result = await this.runQuery(`
                INSERT INTO ScheduledLessons 
                (date, lesson_title, subject_id, section_id, teacher_id, period, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `, [
                testLesson.date,
                testLesson.lesson_title,
                testLesson.subject_id,
                testLesson.section_id,
                testLesson.teacher_id,
                testLesson.period,
                testLesson.status
            ]);
            
            console.log(`✅ تم إدراج الحصة الاختبارية بـ ID: ${result.lastID}`);
            
            // التحقق من إنشاء TextbookEntry تلقائياً
            const textbookCheck = await this.getAllQuery(`
                SELECT * FROM TextbookEntries WHERE scheduled_lesson_id = ?
            `, [result.lastID]);
            
            if (textbookCheck.length > 0) {
                console.log('✅ تم إنشاء إدخال دفتر النصوص تلقائياً');
            } else {
                console.log('❌ لم يتم إنشاء إدخال دفتر النصوص');
            }
            
            // حذف البيانات الاختبارية
            await this.runQuery('DELETE FROM TextbookEntries WHERE scheduled_lesson_id = ?', [result.lastID]);
            await this.runQuery('DELETE FROM ScheduledLessons WHERE id = ?', [result.lastID]);
            console.log('🗑️ تم حذف البيانات الاختبارية');
            
        } catch (error) {
            console.error('❌ خطأ في اختبار النظام:', error);
        } finally {
            this.close();
        }
    }
}

// إذا تم تشغيل الملف مباشرة
if (require.main === module) {
    const hardening = new DatabaseHardening();
    
    // تطبيق جميع التحسينات
    hardening.applyAllHardening()
        .then(() => {
            // اختبار النظام الجديد
            return hardening.testNewSystem();
        })
        .catch(console.error);
}

module.exports = DatabaseHardening;
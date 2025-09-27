const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function updateLessonSectionIds() {
    console.log('🔄 تحديث معرفات الأقسام في الدروس لربطها بالأقسام الحالية...\n');

    const currentDbPath = path.join(__dirname, '..', 'classroom.db');

    try {
        const currentDb = new sqlite3.Database(currentDbPath);

        // جلب الأقسام الحالية
        const sections = await new Promise((resolve, reject) => {
            currentDb.all("SELECT * FROM Sections", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        console.log(`🏫 الأقسام المتاحة (${sections.length}):`);
        sections.forEach((section, index) => {
            console.log(`   ${index + 1}. ID: ${section.id} - الاسم: ${section.name}`);
        });

        // جلب الدروس الحالية
        const lessons = await new Promise((resolve, reject) => {
            currentDb.all("SELECT * FROM Lessons", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        console.log(`\n📚 الدروس الحالية (${lessons.length}):`);
        lessons.forEach((lesson, index) => {
            console.log(`   ${index + 1}. ${lesson.id} - القسم الحالي: ${lesson.sectionId}`);
        });

        // توزيع الدروس على الأقسام المتاحة
        if (sections.length > 0) {
            console.log('\n🔄 تحديث معرفات الأقسام...');
            
            for (let i = 0; i < lessons.length; i++) {
                // توزيع دائري - كل درس يأخذ قسماً مختلفاً
                const sectionIndex = i % sections.length;
                const newSectionId = sections[sectionIndex].id;
                const lesson = lessons[i];

                await new Promise((resolve, reject) => {
                    currentDb.run(
                        "UPDATE Lessons SET sectionId = ? WHERE id = ?", 
                        [newSectionId, lesson.id], 
                        (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            console.log(`✅ تم تحديث الدرس ${lesson.id}: ${lesson.sectionId} → ${newSectionId} (${sections[sectionIndex].name})`);
                            resolve();
                        }
                    );
                });
            }

            // التحقق من النتائج
            console.log('\n📊 التحقق من التحديث:');
            const updatedLessons = await new Promise((resolve, reject) => {
                currentDb.all("SELECT id, sectionId FROM Lessons LIMIT 10", (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            updatedLessons.forEach((lesson, index) => {
                const section = sections.find(s => s.id === lesson.sectionId);
                console.log(`   ${index + 1}. ${lesson.id} - القسم: ${section ? section.name : lesson.sectionId}`);
            });

            console.log('\n✅ تم تحديث معرفات الأقسام بنجاح!');
        } else {
            console.log('❌ لا توجد أقسام متاحة للربط');
        }

        currentDb.close();

    } catch (error) {
        console.error('❌ خطأ في تحديث معرفات الأقسام:', error);
        process.exit(1);
    }
}

updateLessonSectionIds();
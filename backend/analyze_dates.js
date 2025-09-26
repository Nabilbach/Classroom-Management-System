const { Attendance, Student, Section } = require('./models');

async function analyzeDates() {
    try {
        console.log('\n=== تحليل تواريخ سجلات الحضور ===\n');
        
        // جلب كل السجلات مع التواريخ والأقسام
        const records = await Attendance.findAll({
            include: [{
                model: Student,
                as: 'student',
                attributes: ['firstName', 'lastName']
            }, {
                model: Section,
                attributes: ['name']
            }],
            order: [['date', 'ASC'], ['sectionId', 'ASC']]
        });
        
        console.log(`إجمالي السجلات: ${records.length}`);
        
        // تحليل التواريخ
        const dateStats = {};
        const sectionStats = {};
        
        records.forEach(record => {
            const date = record.date;
            const sectionName = record.Section?.name || 'غير محدد';
            
            // إحصائيات التواريخ
            if (!dateStats[date]) {
                dateStats[date] = { total: 0, present: 0, absent: 0, sections: new Set() };
            }
            dateStats[date].total++;
            dateStats[date].sections.add(sectionName);
            if (record.isPresent) {
                dateStats[date].present++;
            } else {
                dateStats[date].absent++;
            }
            
            // إحصائيات الأقسام
            if (!sectionStats[sectionName]) {
                sectionStats[sectionName] = { total: 0, present: 0, absent: 0, dates: new Set() };
            }
            sectionStats[sectionName].total++;
            sectionStats[sectionName].dates.add(date);
            if (record.isPresent) {
                sectionStats[sectionName].present++;
            } else {
                sectionStats[sectionName].absent++;
            }
        });
        
        console.log('\n--- إحصائيات التواريخ ---');
        Object.keys(dateStats).sort().forEach(date => {
            const stats = dateStats[date];
            const sections = Array.from(stats.sections).join(', ');
            console.log(`${date}: ${stats.total} سجل (${stats.present} حاضر، ${stats.absent} غائب) في الأقسام: ${sections}`);
        });
        
        console.log('\n--- إحصائيات الأقسام ---');
        Object.keys(sectionStats).sort().forEach(sectionName => {
            const stats = sectionStats[sectionName];
            const dates = Array.from(stats.dates).sort().join(', ');
            console.log(`${sectionName}: ${stats.total} سجل (${stats.present} حاضر، ${stats.absent} غائب) في التواريخ: ${dates}`);
        });
        
        // البحث عن السجلات المشكوك بها (نفس الوقت)
        console.log('\n--- السجلات المشكوك بها (نفس وقت الإنشاء) ---');
        const timeGrouped = {};
        records.forEach(record => {
            const timestamp = record.createdAt.toISOString();
            if (!timeGrouped[timestamp]) {
                timeGrouped[timestamp] = [];
            }
            timeGrouped[timestamp].push(record);
        });
        
        Object.keys(timeGrouped).forEach(timestamp => {
            const group = timeGrouped[timestamp];
            if (group.length > 5) { // مجموعة كبيرة من السجلات في نفس الوقت
                console.log(`${timestamp}: ${group.length} سجل في نفس الوقت`);
                console.log(`  التاريخ: ${group[0].date}, القسم: ${group[0].Section?.name || 'غير محدد'}`);
            }
        });
        
        // اقتراح التواريخ للعرض
        console.log('\n--- التواريخ المقترحة للعرض في الواجهة ---');
        const sortedDates = Object.keys(dateStats).sort().reverse(); // الأحدث أولاً
        sortedDates.slice(0, 10).forEach(date => {
            const stats = dateStats[date];
            console.log(`${date}: ${stats.total} سجل في ${stats.sections.size} قسم`);
        });
        
    } catch (error) {
        console.error('خطأ في التحليل:', error);
    }
}

// تشغيل التحليل
if (require.main === module) {
    analyzeDates().then(() => {
        console.log('\nتم التحليل بنجاح!');
        process.exit(0);
    }).catch(err => {
        console.error('فشل التحليل:', err);
        process.exit(1);
    });
}

module.exports = { analyzeDates };
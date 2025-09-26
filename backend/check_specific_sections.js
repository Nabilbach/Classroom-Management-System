const { Attendance, Student, Section } = require('./models');

async function checkSpecificSections() {
    try {
        console.log('\n=== تحقق من سجلات 24 سبتمبر ===\n');
        
        const targetDate = '2025-09-24';
        const targetSections = ['TCS-3', 'TCLSH-2'];
        
        console.log(`البحث في التاريخ: ${targetDate}`);
        console.log(`الأقسام المطلوبة: ${targetSections.join(', ')}\n`);
        
        // البحث عن الأقسام في قاعدة البيانات
        for (const sectionName of targetSections) {
            console.log(`--- فحص القسم: ${sectionName} ---`);
            
            // العثور على القسم
            const section = await Section.findOne({ where: { name: sectionName } });
            if (!section) {
                console.log(`❌ القسم ${sectionName} غير موجود في قاعدة البيانات`);
                continue;
            }
            
            console.log(`✅ القسم موجود - ID: ${section.id}`);
            
            // البحث عن سجلات الحضور لهذا القسم في 24 سبتمبر
            const attendanceRecords = await Attendance.findAll({
                where: {
                    sectionId: section.id,
                    date: targetDate
                },
                include: [{
                    model: Student,
                    as: 'student',
                    attributes: ['firstName', 'lastName', 'classOrder']
                }],
                order: [['studentId', 'ASC']]
            });
            
            console.log(`📊 عدد السجلات الموجودة: ${attendanceRecords.length}`);
            
            if (attendanceRecords.length === 0) {
                console.log(`❌ لا توجد سجلات حضور للقسم ${sectionName} في تاريخ ${targetDate}`);
            } else {
                console.log(`✅ توجد ${attendanceRecords.length} سجل:`);
                attendanceRecords.forEach((record, index) => {
                    const student = record.student;
                    const status = record.isPresent ? '✓ حاضر' : '✗ غائب';
                    console.log(`  ${index + 1}. ${student?.firstName} ${student?.lastName} - ${status}`);
                });
            }
            
            // عد إجمالي الطلاب في القسم
            const totalStudents = await Student.count({
                where: { sectionId: section.id }
            });
            console.log(`👥 إجمالي الطلاب في القسم: ${totalStudents}`);
            
            console.log(''); // سطر فارغ
        }
        
        // البحث عن جميع السجلات في 24 سبتمبر
        console.log('--- جميع السجلات في 24 سبتمبر ---');
        const allRecordsOn24 = await Attendance.findAll({
            where: { date: targetDate },
            include: [{
                model: Student,
                as: 'student',
                attributes: ['firstName', 'lastName']
            }, {
                model: Section,
                attributes: ['name']
            }],
            order: [['sectionId', 'ASC'], ['studentId', 'ASC']]
        });
        
        console.log(`📊 إجمالي السجلات في ${targetDate}: ${allRecordsOn24.length}`);
        
        // تجميع حسب القسم
        const sectionGroups = {};
        allRecordsOn24.forEach(record => {
            const sectionName = record.Section?.name || 'غير محدد';
            if (!sectionGroups[sectionName]) {
                sectionGroups[sectionName] = [];
            }
            sectionGroups[sectionName].push(record);
        });
        
        Object.keys(sectionGroups).forEach(sectionName => {
            const records = sectionGroups[sectionName];
            console.log(`📝 ${sectionName}: ${records.length} سجل`);
        });
        
        // البحث عن سجلات TCLSH-2 في جميع التواريخ
        console.log('\n--- سجلات TCLSH-2 في جميع التواريخ ---');
        const tclsh2Section = await Section.findOne({ where: { name: 'TCLSH-2' } });
        if (tclsh2Section) {
            const tclsh2Records = await Attendance.findAll({
                where: { sectionId: tclsh2Section.id },
                attributes: ['date', 'isPresent'],
                group: ['date'],
                raw: true
            });
            
            if (tclsh2Records.length === 0) {
                console.log('❌ لا توجد أي سجلات للقسم TCLSH-2 في أي تاريخ');
            } else {
                console.log(`📊 TCLSH-2 له سجلات في ${tclsh2Records.length} تاريخ مختلف:`);
                tclsh2Records.forEach(record => {
                    console.log(`  - ${record.date}`);
                });
            }
        }
        
    } catch (error) {
        console.error('خطأ في التحقق:', error);
    }
}

// تشغيل التحقق
if (require.main === module) {
    checkSpecificSections().then(() => {
        console.log('\nتم التحقق بنجاح!');
        process.exit(0);
    }).catch(err => {
        console.error('فشل التحقق:', err);
        process.exit(1);
    });
}

module.exports = { checkSpecificSections };
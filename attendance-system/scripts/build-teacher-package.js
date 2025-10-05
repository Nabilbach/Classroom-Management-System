const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const archiver = require('archiver');

async function buildTeacherPackage(teacherFolder) {
  try {
    console.log(`بدء إنشاء نسخة التوزيع من: ${teacherFolder}`);
    // 1. بناء الباكيند
    console.log('بناء الباكيند...');
    await execPromise(`cd "${teacherFolder}" && npm install`);
    // 2. بناء الفرونت إند (إذا كان موجوداً)
    if (fs.existsSync(path.join(teacherFolder, 'frontend'))) {
      console.log('بناء الفرونت إند...');
      await execPromise(`cd "${teacherFolder}/frontend" && npm install && npm run build`);
    }
    // 3. نقل ملفات البناء إلى مجلد التوزيع
    const distFolder = path.join(teacherFolder, 'dist');
    fs.ensureDirSync(distFolder);
    fs.copySync(path.join(teacherFolder, 'backend'), path.join(distFolder, 'backend'));
    if (fs.existsSync(path.join(teacherFolder, 'frontend/dist'))) {
      fs.copySync(path.join(teacherFolder, 'frontend/dist'), path.join(distFolder, 'public'));
    }
    fs.copySync(path.join(teacherFolder, 'attendance-local.db'), path.join(distFolder, 'attendance-local.db'));
    fs.copySync(path.join(teacherFolder, 'package.json'), path.join(distFolder, 'package.json'));
    // ملف تشغيل للويندوز
    const batContent = `@echo off\necho Starting Attendance System...\nnpm start\npause`;
    fs.writeFileSync(path.join(distFolder, 'start.bat'), batContent);
    // 4. إنشاء ملف ZIP للتوزيع
    const teacherName = path.basename(teacherFolder);
    const zipPath = path.join(teacherFolder, `${teacherName}-package.zip`);
    console.log(`إنشاء حزمة الزيب: ${zipPath}`);
    await createZipArchive(distFolder, zipPath);
    console.log('تم إنشاء نسخة التوزيع بنجاح!');
    console.log(`يمكن تنزيل الملف من: ${zipPath}`);
    return { zipPath, distFolder };
  } catch (error) {
    console.error('خطأ في إنشاء نسخة التوزيع:', error);
    throw error;
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`خطأ: ${stderr}`);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function createZipArchive(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', function() { resolve(); });
    archive.on('error', function(err) { reject(err); });
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

if (require.main === module) {
  const teacherFolder = process.argv[2];
  if (!teacherFolder) {
    console.error('يرجى تحديد مجلد نسخة الأستاذ');
    console.error('مثال: node build-teacher-package.js ./teacher-instances/ahmad');
    process.exit(1);
  }
  buildTeacherPackage(teacherFolder)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = buildTeacherPackage;

const db = require('./models');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 🚨 نظام حماية متعدد المراحل - Multi-layer Protection System
class DatabaseResetProtection {
  constructor() {
    this.requiredConfirmations = [
      'أفهم أن هذا سيحذف جميع البيانات نهائياً',
      'تم أخذ نسخة احتياطية مؤكدة خلال آخر 24 ساعة',
      'تم الحصول على موافقة المشرف المباشر',
      'نعم احذف كل شيء نهائياً ولا يمكن التراجع'
    ];
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async checkEnvironment() {
    // منع التشغيل في بيئة الإنتاج
    if (process.env.NODE_ENV === 'production') {
      console.log('🚫 خطر! لا يمكن تشغيل reset_db في بيئة الإنتاج');
      console.log('🔒 تم منع العملية لحماية البيانات');
      process.exit(1);
    }

    // التحقق من وجود متغير حماية خاص
    if (!process.env.ALLOW_DATABASE_RESET) {
      console.log('🚫 متغير الحماية ALLOW_DATABASE_RESET غير موجود');
      console.log('💡 لتفعيل هذا السكريبت، استخدم: set ALLOW_DATABASE_RESET=true');
      process.exit(1);
    }

    console.log('✅ فحص البيئة: تم');
  }

  async checkBackupAge() {
    console.log('🔍 فحص النسخ الاحتياطية...');
    
    // قائمة النسخ الاحتياطية المحتملة
    const backupPaths = [
      './security_backups',
      './emergency_environment_backups',
      '.'
    ];

    let latestBackup = null;
    let latestBackupTime = 0;

    for (const backupPath of backupPaths) {
      if (fs.existsSync(backupPath)) {
        const files = fs.readdirSync(backupPath);
        
        for (const file of files) {
          if (file.includes('backup') && (file.endsWith('.db') || file.endsWith('.json'))) {
            const filePath = path.join(backupPath, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime.getTime() > latestBackupTime) {
              latestBackupTime = stats.mtime.getTime();
              latestBackup = filePath;
            }
          }
        }
      }
    }

    if (!latestBackup) {
      console.log('❌ لم يتم العثور على أي نسخة احتياطية');
      console.log('🚨 يجب إنشاء نسخة احتياطية قبل المتابعة');
      process.exit(1);
    }

    const backupAge = Date.now() - latestBackupTime;
    const hoursOld = backupAge / (1000 * 60 * 60);

    console.log(`📦 آخر نسخة احتياطية: ${latestBackup}`);
    console.log(`⏰ عمر النسخة: ${hoursOld.toFixed(2)} ساعة`);

    if (hoursOld > 24) {
      console.log('❌ النسخة الاحتياطية أقدم من 24 ساعة');
      console.log('🚨 يجب إنشاء نسخة احتياطية حديثة أولاً');
      process.exit(1);
    }

    console.log('✅ فحص النسخ الاحتياطية: تم');
  }

  async requireMultipleConfirmations() {
    console.log('\n🚨 تحذير خطير: أنت على وشك حذف جميع البيانات!');
    console.log('🗃️ سيتم حذف: بيانات الطلاب، المعلمين، الجداول، التقييمات، كل شيء!');
    console.log('⚠️ هذه العملية غير قابلة للتراجع!\n');

    // طلب التأكيدات المتعددة
    for (let i = 0; i < this.requiredConfirmations.length; i++) {
      const confirmation = this.requiredConfirmations[i];
      console.log(`\n📝 التأكيد ${i + 1}/${this.requiredConfirmations.length}:`);
      console.log(`اكتب بالضبط: "${confirmation}"`);
      
      const answer = await this.askQuestion('> ');
      
      if (answer.trim() !== confirmation) {
        console.log('\n❌ إجابة غير صحيحة. تم إلغاء العملية لحماية البيانات.');
        console.log('✅ البيانات محمية - لم يتم حذف أي شيء');
        this.rl.close();
        process.exit(0);
      }
      
      console.log(`✅ التأكيد ${i + 1} صحيح`);
    }

    console.log('\n🔓 تم قبول جميع التأكيدات');
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async logDangerousOperation() {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation: 'DATABASE_RESET',
      user: process.env.USERNAME || 'unknown',
      workingDirectory: process.cwd(),
      environment: process.env.NODE_ENV || 'unknown',
      confirmationsReceived: this.requiredConfirmations.length
    };

    // كتابة لوق الأمان
    const logPath = './security_audit.log';
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logPath, logLine);
    console.log(`📝 تم تسجيل العملية في: ${logPath}`);
  }
}

const resetDatabase = async () => {
  const protection = new DatabaseResetProtection();
  
  try {
    console.log('🛡️ بدء فحوصات الأمان...\n');
    
    // فحص البيئة
    await protection.checkEnvironment();
    
    // فحص النسخ الاحتياطية
    await protection.checkBackupAge();
    
    // طلب التأكيدات المتعددة
    await protection.requireMultipleConfirmations();
    
    // تسجيل العملية
    await protection.logDangerousOperation();
    
    console.log('\n🔄 بدء عملية إعادة تعيين قاعدة البيانات...');
    console.log('⚠️ آخر فرصة للتراجع (Ctrl+C خلال 10 ثواني)');
    
    // انتظار 10 ثواني للتراجع
    for (let i = 10; i > 0; i--) {
      process.stdout.write(`\r⏰ باقي ${i} ثانية للتراجع...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n\n🚨 بدء الحذف الآن...');
    
    console.log('Dropping all tables...');
    await db.sequelize.drop();
    console.log('All tables dropped.');

    console.log('Re-synchronizing database...');
    await db.sequelize.sync();
    console.log('Database re-synchronized successfully.');

    console.log('✅ Database reset complete.');
    
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
  } finally {
    await db.sequelize.close();
    protection.rl.close();
    console.log('Database connection closed.');
  }
};

// تشغيل مع الحماية
resetDatabase();

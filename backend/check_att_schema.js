const sequelize = require('./config/database');

async function main(){
  try {
    const [att,] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='Attendances'");
    console.log('Attendances table exists:', att.length>0);
    if(att.length>0){
      const [cols,] = await sequelize.query("PRAGMA table_info('Attendances')");
      console.log('Attendances columns:', cols);
    }
    const [stuCols] = await sequelize.query("PRAGMA table_info('Students')");
    console.log('Students columns:', stuCols);
    const [secCols] = await sequelize.query("PRAGMA table_info('Sections')");
    console.log('Sections columns:', secCols);
  } catch(e){
    console.error('Error inspecting schema:', e);
  } finally {
    await sequelize.close();
  }
}
main();

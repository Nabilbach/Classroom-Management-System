const path = require('path');
const { Sequelize } = require('sequelize');
(async()=>{
  const file = path.resolve(__dirname, '..', '..', 'classroom.db');
  const s = new Sequelize({ dialect: 'sqlite', storage: file, logging: false});
  try{
    await s.authenticate();
    console.log('DB:', file);
    const tables = ['Lessons', 'ScheduledLessons'];
    for(const t of tables){
      try{
        const [rows] = await s.query(`SELECT * FROM \"${t}\" LIMIT 5`);
        console.log('\nTable:', t);
        console.table(rows);
      }catch(e){
        console.log(t+': table_missing or error -', e.message);
      }
    }
  }catch(e){
    console.error('err', e.message);
  }finally{ await s.close(); }
})();

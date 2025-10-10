const path = require('path');
const { Sequelize } = require('sequelize');
(async()=>{
  const file = path.resolve(__dirname, '..', '..', 'classroom.db');
  const s = new Sequelize({ dialect: 'sqlite', storage: file, logging: false});
  try{
    await s.authenticate();
    console.log('DB:', file);
    const names = ['Lesson','Lessons'];
    for(const n of names){
      try{
        const [[{count}]] = await s.query(`SELECT COUNT(1) as count FROM "${n}"`);
        console.log(n+':', count);
      }catch(e){
        console.log(n+': table_missing');
      }
    }
  }catch(e){
    console.error('err', e.message);
  }finally{ await s.close(); }
})();

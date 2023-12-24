const fs = require('fs')
const mysql = require('mysql')
let config = {}



const db = {
  createDB: (config={}) => {
    console.log('config.mysql:', config)
    return new Promise((resolve, reject) => {
      if (!config.database) {
        reject('DatabaseName is required!')
        return
      }
      
      let sql = ''
      if (config.charset && config.collation) {
        sql = `CREATE SCHEMA ${config.database} DEFAULT CHARACTER SET ${config.charset} COLLATE ${config.collation};`
      } else {
        sql = `CREATE DATABASE ${config.database};`
      }
      
      const conn = mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password
      })

      conn.connect((err) => {
        console.log('DB is connecting.')
        if (err) {
          reject(err);
          return;
        }
        conn.query(sql, (queryErr, result) => {
          console.log('DB is creating database.')
          conn.end(); // close connection
          if (queryErr) {
            reject(queryErr);
          } else {
            resolve('Database created');
          }
        });
      })
    })
  },
  pool : (config={})=>{
    const dbPool = mysql.createPool({config})
    return this
  }

}

module.exports = db
// read config data then trans it to obj
fs.readFile('config/config.json', 'utf8', (err, data) => {
  if (err) return console.error(err)
  config = JSON.parse(data)
  db.createDB(config.mysql).then(result=> console.log(result)).catch(err=>console.error(err))
})
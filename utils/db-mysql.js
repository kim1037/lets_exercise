const mysql = require('mysql2')

const db = {
  createDB: (config = {}) => {
    return new Promise((resolve, reject) => {
      if (!config.database) {
        reject(new Error('DatabaseName is required!'))
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
      console.log('DB is connecting.')

      conn.query(sql, (err, results, fields) => {
        conn.end() // close connection
        if (err) {
          reject(err)
        } else {
          resolve('Database has created')
        }
      })
    })
  },
  pool: (config = {}) => {
    const dbPool = mysql.createPool({ config })
    return this
  }

}

module.exports = db

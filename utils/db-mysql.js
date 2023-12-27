const mysql = require('mysql2')
let pool = {}
const db = {
  init: (config = {}) => {
  // config as belows
  // host: 'localhost',
  // user: 'root',
  // database: 'test',
  // waitForConnections: true,
  // connectionLimit: 10,
  // maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  // idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  // queueLimit: 0,
  // enableKeepAlive: true,
  // keepAliveInitialDelay: 0

    pool = mysql.createPool({
      connectionLimit: 10,
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database
    })
    return this
  },
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
          resolve(`Database ${config.database} has created`)
        }
      })
    })
  },
  handleDisconnect: (config = {}) => { // 待調整
    // 與資料庫連線
    const connection = mysql.createConnection(config)

    // 資料庫連線發生錯誤處理
    connection.connect(function (err) {
      if (err) {
        console.log('error when connecting to db:', err)
        // 2秒後重新連線
        setTimeout(db.handleDisconnect, 2000)
      }
    })

    // 連線發生錯誤處理
    connection.on('error', function (err) {
      console.log('db error', err)
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        // 連線失效處理
        db.handleDisconnect()
      } else {
        throw err
      }
    })
  },
  query: (sql = '') => {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) {
          reject(err)
        } else {
          conn.query(sql, (err, result) => {
            if (err) {
              reject(err)
            } else {
              resolve('Query is executed success.')
            }
            conn.release()
          })
        }
      })
    })
  },
  insert: () => {

  },
  select: () => {},
  update: () => {},
  delete: () => {},
  end: () => {
    return new Promise((resolve, reject) => {
      pool.end(err => {
        if (err) {
          reject(err)
        } else {
          resolve('DB is closed.')
        }
      })
    })
  }
}

module.exports = db

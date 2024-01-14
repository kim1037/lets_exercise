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
          conn.query(sql, (err, results, fields) => {
            conn.release()
            if (err) {
              reject(err)
            } else {
              resolve([results, fields])
            }
          })
        }
      })
    })
  },
  insert: (table = '', inserts = {}) => {
    return new Promise((resolve, reject) => {
      if (!table) {
        reject(new Error('Table name is required!'))
        return
      }
      const columns = Object.keys(inserts)
      let values = ''
      columns.forEach(c => {
        if (typeof inserts[c] === 'number') {
          values += inserts[c]
        } else {
          values += `"${inserts[c]}"`
        }
        if (columns.indexOf(c) !== columns.length - 1) {
          values += ', '
        }
      })

      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values});`
      db.query(sql).then(r => resolve(r)).catch(e => reject(e))
    })
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
          resolve('Database is closed.')
        }
      })
    })
  },
  getColumns: (database = '', table = '') => {
    return new Promise((resolve, reject) => {
      if (!table || !database) {
        reject(new Error('Database name and Table name is required!'))
        return
      }
      const sql = `DESCRIBE ${database}.${table};`
      db.query(sql).then(results => {
        const columns = results[0].map(r => r.Field)
        resolve(columns)
      }).catch(e => reject(e))
    })
  },
  dropDB: (database = '') => {
    return new Promise((resolve, reject) => {
      if (!database) {
        reject(new Error('Database name is required!'))
        return
      }
      const sql = `DROP DATABASE ${database};`
      db.query(sql).then(r => resolve(`${database} has been dropped.`)).catch(e => reject(e))
    })
  }

}

module.exports = db

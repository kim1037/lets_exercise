const db = require('../utils/db-mysql.js')
const fs = require('fs')

// Create database according to config
fs.readFile('config/config.json', 'utf8', (err, data) => {
  // read config data then trans it to obj
  if (err) return console.error(err)
  const config = JSON.parse(data)
  db.createDB(config.mysql).then(result => console.log(result)).catch(err => console.error(err))
})

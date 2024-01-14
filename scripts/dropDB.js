const db = require('../utils/db-mysql')
const config = require('../config/config.json')
db.init(config.mysql)

db.dropDB(config.mysql.database).then(r => {
  console.log(r)
  db.end()
}).catch(err => console.log(err))

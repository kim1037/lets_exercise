const db = require('../utils/db-mysql.js')
const config = require('../config/config.json')

db.createDB(config.mysql).then(result => console.log(result)).catch(err => console.error(err))

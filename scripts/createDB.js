const db = require('../utils/db-mysql.js')
const fs = require('fs')

// Create database according to config
fs.readFile('config/config.json', 'utf8', (err, data) => {
  // read config data then trans it to obj
  if (err) return console.error(err)
  const config = JSON.parse(data)
  db.createDB(config.mysql).then(result => console.log(result)).catch(err => console.error(err))
})

// create user table

const userSql = ` 
  CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nationalId CHAR(10) NOT NULL,
  email VARCHAR(100) NOT NULL,
  account VARCHAR(50) NOT NULL,
  password VARCHAR(20) NOT NULL,
  firstName VARCHAR(20) NOT NULL,
  lastName VARCHAR(20) NOT NULL,
  nickName VARCHAR(20),
  gender VARCHAR(10) NOT NULL,
  avatar TEXT,
  introduction VARCHAR(150),
  birthdate DATE NOT NULL,
  playSince DATE,
  phoneNumber CHAR(10) NOT NULL,
  )`

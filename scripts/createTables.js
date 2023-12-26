const db = require('../utils/db-mysql.js')
const config = require('../config/config.json')
db.init(config.mysql)
// create user table

const userTable = `CREATE TABLE IF NOT EXISTS users (
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
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
  )`

const arenaTable = `CREATE TABLE IF NOT EXISTS arenas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  address VARCHAR(100) NOT NULL,
  hasParking BOOLEAN,
  openingHour VARCHAR(50),
  description VARCHAR(150),
  website VARCHAR(150),
  phone VARCHAR(10),
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
  )`

// boc = brand-originating countries
const branchesTable = `CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  boc VARCHAR(50),
  logoImg VARCHAR(150),
  description TEXT,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL)`

const shuttlecocksTable = `CREATE TABLE IF NOT EXISTS shuttlecocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  branchId INT NOT NULL,
  fixPrice INT,
  description VARCHAR(150),
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  FOREIGN KEY (branchId) REFERENCES branches(id)
  )`

const activitiesTable = `CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  arenaId INT NOT NULL,
  shuttlecockId INT,
  date DATE NOT NULL,
  shuttlecockProvide BOOLEAN NOT NULL,
  level VARCHAR(30) NOT NULL,
  fee INT NOT NULL,
  numsOfPeople INT NOT NULL,
  description VARCHAR(150),
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (arenaId) REFERENCES arenas(id),
  FOREIGN KEY (shuttlecockId) REFERENCES shuttlecocks(id)
  )`

db.query(userTable).then(r => { console.log('Table users created.') }).catch(err => console.error(err))
db.query(arenaTable).then(r => {
  console.log('Table arenas created.')
  return db.query(branchesTable)
}).then(r => {
  console.log('Table branches created.')
  return db.query(shuttlecocksTable)
}).then(r => {
  console.log('Table shuttlecocks created.')
  return db.query(activitiesTable)
}).then(r => {
  console.log('Table activities created.')
}).catch(err => console.error(err))

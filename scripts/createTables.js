const db = require('../utils/db-mysql.js')
const config = require('../config/config.json')
db.init(config.mysql)
// create user table

// password 因為要加密避免長度不夠設為TEXT
const usersTable = `CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nationalId CHAR(10) NOT NULL,
  email VARCHAR(100) NOT NULL,
  account VARCHAR(50) NOT NULL,
  password TEXT NOT NULL,  
  firstName VARCHAR(20) NOT NULL,
  lastName VARCHAR(20) NOT NULL,
  nickName VARCHAR(20),
  gender VARCHAR(10) NOT NULL,
  avatar TEXT,
  introduction VARCHAR(150),
  birthdate DATE NOT NULL,
  playSince DATE,
  phoneNumber CHAR(10) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )`

const arenasTable = `CREATE TABLE IF NOT EXISTS arenas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  address VARCHAR(150),
  image TEXT,
  hasParking BOOLEAN,
  openingHour TEXT,
  description TEXT,
  website TEXT,
  phone VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )`

// boc = brand-originating countries
const branchesTable = `CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  boc VARCHAR(50),
  logoImg TEXT,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL)`

const shuttlecocksTable = `CREATE TABLE IF NOT EXISTS shuttlecocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  branchId INT,
  fixedPrice INT,
  image TEXT,
  description VARCHAR(150),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (branchId) REFERENCES branches(id)
  )`

const activitiesTable = `CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  arenaId INT NOT NULL,
  shuttlecockId INT,
  date DATE NOT NULL,
  shuttlecockProvide BOOLEAN,
  level VARCHAR(30) NOT NULL,
  fee INT NOT NULL,
  numsOfPeople INT NOT NULL,
  totalPeople INT NOT NULL,
  description VARCHAR(150),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (arenaId) REFERENCES arenas(id),
  FOREIGN KEY (shuttlecockId) REFERENCES shuttlecocks(id)
  )`

// follower => the person who follow you
// following => the person who you follow
const followshipsTable = `CREATE TABLE IF NOT EXISTS followships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  followerId INT NOT NULL,
  followingId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (followerId) REFERENCES users(id),
  FOREIGN KEY (followingId) REFERENCES users(id)
  )`

const userReviewsTable = `CREATE TABLE IF NOT EXISTS user_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  rating FLOAT NOT NULL,
  review TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
  )`

const participantsTable = `CREATE TABLE IF NOT EXISTS participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  activityId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (activityId) REFERENCES activities(id)
  )`

// 由於有關聯的順序問題，因此用鏈接方式建立table
db.query(usersTable).then(r => {
  console.log('Table users created.')
  return db.query(followshipsTable)
}).then(r => {
  console.log('Table followships created.')
  return db.query(arenasTable)
}).then(r => {
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
  return db.query(userReviewsTable)
}).then(r => {
  console.log('Table user_reviews created.')
  return db.query(participantsTable)
}).then(r => {
  console.log('Table participants created.')
  return db.end()
}).then(r => {
  console.log(r)
}).catch(err => console.error(err))

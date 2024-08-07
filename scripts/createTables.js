const db = require('../utils/db-mysql.js')
const config = require('../config/config.json')
db.init(config.mysql)
// create region table
const regionsTable = `CREATE TABLE IF NOT EXISTS regions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  region VARCHAR(20) NOT NULL
)
`

// password 因為要加密避免長度不夠設為TEXT
const usersTable = `CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nationalId CHAR(10),
  email VARCHAR(100) NOT NULL,
  account VARCHAR(50),
  password TEXT,  
  firstName VARCHAR(20),
  lastName VARCHAR(20),
  nickName VARCHAR(20),
  gender VARCHAR(10),
  avatar TEXT,
  introduction VARCHAR(150),
  birthdate DATE ,
  playSince DATE,
  phoneNumber CHAR(10) ,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )`

const arenasTable = `CREATE TABLE IF NOT EXISTS arenas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  address VARCHAR(150),
  regionId INT,
  image TEXT,
  hasParking BOOLEAN,
  openingHour TEXT,
  description TEXT,
  website TEXT,
  phone VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (regionId) REFERENCES regions(id)
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
  hostId INT NOT NULL,
  arenaId INT NOT NULL,
  shuttlecockId INT,
  date DATE NOT NULL,
  timeStart TIME NOT NULL,
  timeEnd TIME NOT NULL,
  shuttlecockProvide BOOLEAN,
  levelId INT NOT NULL,
  fee INT NOT NULL,
  numsOfPeople INT NOT NULL,
  currentJoinNums INT DEFAULT 0 NOT NULL,
  totalPeople INT NOT NULL,
  description VARCHAR(150),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (hostId) REFERENCES users(id),
  FOREIGN KEY (arenaId) REFERENCES arenas(id),
  FOREIGN KEY (levelId) REFERENCES levels(id),
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
  reviewerId INT NOT NULL,
  rating INT NOT NULL,
  review TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (reviewerId) REFERENCES users(id)
  )`

const participantsTable = `CREATE TABLE IF NOT EXISTS participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  activityId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (activityId) REFERENCES activities(id)
    ON DELETE CASCADE
  )`

const levelsTable = `CREATE TABLE IF NOT EXISTS levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level VARCHAR(10) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )`

// 由於有關聯的順序問題，因此用鏈接方式建立table
db.query(regionsTable).then(r => {
  console.log('Table regions created.')
  return db.query(levelsTable)
}).then(r => {
  console.log('Table levels created.')
  return db.query(usersTable)
}).then(r => {
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
}).catch(err => console.error(err)).finally(() => db.end())

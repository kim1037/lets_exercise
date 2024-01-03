const db = require('../utils/db-mysql.js')
const faker = require('faker')
const config = require('../config/config.json')
db.init(config.mysql)

function getTimestamp () { // js中沒有指定格式的內建方法
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0') // 月份從0開始，需要加1；並且補齊至兩位數
  const day = String(now.getDate()).padStart(2, '0') // 日補齊至兩位數
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function randomNationalId (gender) {
  const capital = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))
  const nums = Array.from({ length: 10 }, (_, i) => i.toString())
  let id = capital[Math.floor(Math.random() * capital.length)] + (gender === 'male' ? 1 : 2)
  for (let i = 0; i < 8; i++) {
    id += nums[Math.floor(Math.random() * nums.length)]
  }
  return id
}

function randomPhoneNumber () {
  const nums = Array.from({ length: 10 }, (_, i) => i.toString())
  let number = '09'
  for (let i = 0; i < 8; i++) {
    number += nums[Math.floor(Math.random() * nums.length)]
  }
  return number
}

function randomBirthdate (minAge, maxAge) {
  const today = new Date()
  const minBirthdate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate())
  const maxBirthdate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate())

  const randomBirthdate = new Date(minBirthdate.getTime() + Math.random() * (maxBirthdate.getTime() - minBirthdate.getTime()))
  const year = randomBirthdate.getFullYear()
  const month = String(randomBirthdate.getMonth() + 1).padStart(2, '0')
  const day = String(randomBirthdate.getDate()).padStart(2, '0')

  const formattedDate = `${year}/${month}/${day}`
  return formattedDate
}

function createFakeUser (num) {
  const gender = ['male', 'female'][Math.floor(Math.random() * 2)]
  const user = {
    nationalId: randomNationalId(gender),
    email: `test${num}@test.com`,
    account: `test${num}`,
    password: 'Test1111',
    firstName: faker.name.firstName(gender),
    lastName: faker.name.lastName(),
    nickName: faker.name.findName(gender),
    gender,
    avatar: `https://xsgames.co/randomusers/assets/avatars/${gender}/${Math.floor(Math.random() * 71)}.jpg`,
    introduction: faker.lorem.sentence(5),
    birthdate: randomBirthdate(15, 75),
    playSince: randomBirthdate(0, 15),
    phoneNumber: randomPhoneNumber(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  }
  return user
}

function usersSeeders (nums) {
  // nums => how many rows of data
  let values = ''
  const columns = Object.keys(createFakeUser(1))

  for (let i = 1; i <= nums; i++) {
    const user = createFakeUser(i)
    const data = columns.map(c => user[c])
    let value = '('
    let count = 0
    data.forEach(d => {
      count += 1
      if (typeof d === 'number') {
        value += d
      } else {
        value += `"${d}"`
      }
      if (count !== data.length) {
        value += ', '
      }
    })
    if (i === nums) {
      values += value + ')'
    } else {
      values += value + '), '
    }
  }
  const sql = `INSERT INTO users (${columns.join(', ')}) VALUES ${values}`
  db.query(sql).then(r => console.log('Seeders created!')).catch(e => console.error(e))
}

usersSeeders(5)
// db.getColumns(config.mysql.database, 'users').then(columns => {
//   console.log(columns)
// }).catch(e => console.error(e))

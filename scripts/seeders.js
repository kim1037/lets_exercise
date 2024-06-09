const db = require('../utils/db-mysql.js')
const faker = require('faker')
const bcrypt = require('bcryptjs')
const config = require('../config/config.json')
const branchesJson = require('./seed_data/branches.json')
const shuttlecocksJson = require('./seed_data/shuttlecocks_data.json')
const regions = ['臺北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣', '宜蘭縣', '臺中市', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '高雄市', '臺南市', '嘉義市', '嘉義縣', '屏東縣', '澎湖縣', '花蓮縣', '臺東縣', '金門縣', '連江縣']
const levels = [{ level: '新手' }, { level: '初階' }, { level: '初中階' }, { level: '中階' }, { level: '中高階' }, { level: '高階' }, { level: '職業級' }, { level: '不限' }]
const USER_AMOUNT = 10
const ACTIVITY_AMOUNT = 10
const arenasJson = require('./seed_data/gym_data.json').map(a => {
  a.region = a.region.length > 3 ? a.region.slice(0, 3) : a.region

  return {
    name: a.name,
    image: a.image,
    address: a.address,
    regionId: regions.indexOf(a.region) + 1 || 1,
    description: a.hasParking.join(', ') + '\n' + a.openingHours.join(', '),
    website: a.website,
    phone: a.phone.replace('tel:', '')
  }
})

db.init(config.mysql)

const regionSQL = 'INSERT INTO regions (region) VALUES (\'臺北市\'), (\'新北市\'), (\'基隆市\'), (\'桃園市\'), (\'新竹市\'), (\'新竹縣\'), (\'宜蘭縣\'), (\'臺中市\'), (\'苗栗縣\'), (\'彰化縣\'), (\'南投縣\'), (\'雲林縣\'), (\'高雄市\'), (\'臺南市\'), (\'嘉義市\'), (\'嘉義縣\'), (\'屏東縣\'), (\'澎湖縣\'), (\'花蓮縣\'), (\'臺東縣\'), (\'金門縣\'), (\'連江縣\')'

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

function randomDateFromToday (n) {
  const today = new Date()
  const randomDay = Math.floor(Math.random() * n) // 產生一個介於 0 到 n 之間的隨機數

  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + randomDay) // 將今天日期加上隨機數，得到目標日期

  return targetDate.toISOString().split('T')[0] // 回傳目標日期的 YYYY-MM-DD 格式
}

function createFakeUser (num) {
  const gender = ['male', 'female'][Math.floor(Math.random() * 2)]
  const user = {
    nationalId: randomNationalId(gender),
    email: `test${num}@test.com`,
    account: `test${num}`,
    password: bcrypt.hashSync('Test1111'),
    firstName: faker.name.firstName(gender),
    lastName: faker.name.lastName(),
    nickName: faker.name.findName().slice(0, 20),
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
  return sql
}

// 將[{c1:v1,...},...] => format成 sql 語法格式
function sqlInsertFormatter (table = '', jsonFile = []) {
  // 從object的keys取出columns, 由於json中沒有createdAt和updatedAt屬性，要額外補上
  const columns = Object.keys(jsonFile[0]).concat(['createdAt', 'updatedAt'])
  let values = ''

  // 將每一個物件的values彙整成sql語法中的 (val1, val2, ...)
  for (let i = 0; i < jsonFile.length; i++) {
    const jsonData = jsonFile[i]
    jsonData.createdAt = getTimestamp() // 手動補上timestamp的值
    jsonData.updatedAt = getTimestamp()
    // 將value存成array [val1, val2,...]
    const data = columns.map(c => jsonData[c])
    let value = '('
    let count = 0 // 計算迭代次數
    data.forEach(d => {
      count += 1
      // 非數值型態都要加上""引號包住value
      if (typeof d === 'number') {
        value += d
      } else {
        value += `"${d}"`
      }
      // 若不是最後一個元素則加上逗號
      if (count !== data.length) {
        value += ', '
      }
    })
    // 若為最後一組資料，加上 ")"，否則要加上逗號"),"繼續跑for迴圈
    if (i === jsonFile.length - 1) {
      values += value + ')'
    } else {
      values += value + '), '
    }
  }

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values}`
  return sql
}

function activtySeeders (n) {
  const arenaAmounts = arenasJson.length
  const people = Math.floor(Math.random() * 7 + 1)
  const activity = []

  for (let i = 0; i < n; i++) {
    const randomHour = Math.floor(Math.random() * 22)
    activity.push({
      hostId: Math.floor(Math.random() * 5 + 1),
      arenaId: Math.floor(Math.random() * arenaAmounts + 1),
      shuttlecockId: Math.floor(Math.random() * 10 + 1),
      date: randomDateFromToday(7),
      timeStart: `${randomHour.toString()}:00`,
      timeEnd: `${(randomHour + 2).toString()}:00`,
      shuttlecockProvide: 1,
      levelId: Math.floor(Math.random() * levels.length),
      fee: 100 + Math.floor(Math.random() * 80 + 1),
      numsOfPeople: people,
      totalPeople: 8,
      description: faker.lorem.sentence(5)
    })
  }
  return activity
}

function followshipSeeders (followAmount = 2) {
  // 預設每個人會追蹤兩名其他使用者
  const followships = []
  const userId = Array.from({ length: USER_AMOUNT }, (_, i) => i + 1)
  userId.forEach(id => {
    const excludeSlef = userId.filter(u => u !== id) // 排除自己, 不能追蹤自己
    for (let i = 0; i < followAmount; i++) {
      const randomIndex = Math.floor(Math.random() * excludeSlef.length)
      followships.push({ followerId: id, followingId: excludeSlef[randomIndex] })
      excludeSlef.splice(randomIndex, 1) // 移除已追蹤id
    }
  })
  return followships
}

function userReviewSeeders (reviewsAmount = 3) {
  // 預設每個人會留下三筆reviews
  const reviews = []
  const userId = Array.from({ length: USER_AMOUNT }, (_, i) => i + 1) // [1,2,3,4,5...]
  // 不能對自己寫評論, 不能重複對同一個人評價但可以修改
  userId.forEach(id => {
    const excludeSelf = userId.filter(u => u !== id)
    for (let i = 0; i < reviewsAmount; i++) {
      const randomIndex = Math.floor(Math.random() * excludeSelf.length)
      reviews.push({
        userId: excludeSelf[i],
        reviewerId: id,
        rating: Math.floor(Math.random() * 5 + 1), // 評分為整數1-5
        review: faker.lorem.sentence(3)
      })
      excludeSelf.splice(randomIndex, 1) // 移除已評論id
    }
  })

  return reviews
}

function participantSeeders (num = 1) {
  // 預設每位參加一個活動
  const partcipants = []
  const userId = Array.from({ length: USER_AMOUNT }, (_, i) => i + 1) // [1,2,3,4,5...]
  const activityId = Array.from({ length: ACTIVITY_AMOUNT }, (_, i) => i + 1)
  userId.forEach(id => {
    partcipants.push({
      userId: id,
      activityId: activityId[Math.floor(Math.random() * activityId.length)]
    })
  })

  return partcipants
}

db.query(regionSQL)
  .then(r => {
    console.log('regions table created!')
    return db.query(sqlInsertFormatter('levels', levels))
  }).then(r => {
    console.log('levels table created!')
    return db.query(usersSeeders(USER_AMOUNT))
  }).then(r => {
    console.log('User seeders created!')
    return db.query(sqlInsertFormatter('branches', branchesJson))
  }).then(r => {
    console.log('Branch seeders created!')
    return db.query(sqlInsertFormatter('shuttlecocks', shuttlecocksJson))
  }).then(r => {
    console.log('Shuttlecock seeders created!')
    return db.query(sqlInsertFormatter('arenas', arenasJson))
  }).then(r => {
    console.log('Arena seeders created!')
    return db.query(sqlInsertFormatter('activities', activtySeeders(ACTIVITY_AMOUNT)))
  }).then(r => {
    console.log('Activity seeders created!')
    return db.query(sqlInsertFormatter('user_reviews', userReviewSeeders(3)))
  }).then(r => {
    console.log('User_reviews seeders created!')
    return db.query(sqlInsertFormatter('participants', participantSeeders(1)))
  }).then(r => {
    console.log('Participants seeders created!')
    return db.query(sqlInsertFormatter('followships', followshipSeeders(2)))
  }).then(r => {
    console.log('Followships seeders created!')
    return db.end()
  }).then(r => console.log(r))
  .catch(e => {
    db.end()
    console.error(e)
  })

// db.getColumns(config.mysql.database, 'users').then(columns => {
//   console.log(columns)
// }).catch(e => console.error(e))
// db.query(sqlInsertFormatter('activities', activtySeeders(ACTIVITY_AMOUNT))).then(r=>{return db.end()})

const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const config = require('../config/config.json').mysql
const pool = mysql.createPool({
  connectionLimit: 10,
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database
})

const userController = {
  signup: async (req, res, next) => {
    const { nationalId, email, account, password, checkPassword, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber } = req.body
    try {
      // 檢查必填欄位是否有資料
      if (!nationalId || !email || !account || !password || !checkPassword || !firstName || !lastName || !gender || !birthdate || !phoneNumber) throw new Error('請輸入完整資訊!')
      // check password
      if (password !== checkPassword) throw new Error('確認密碼輸入不一致!')
      if (password.length > 20) throw new Error('密碼不得超過20字元')
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
      if (!passwordRegex.test(password)) throw new Error('密碼必須包含至少一個大寫英文及一個小寫英文和數字的組合，且最少為8字元')
      // 檢查身分證字號是否正確
      const nationalIdRegex = /^[A-Z]{1}[1-2]{1}[0-9]{8}$/
      if (!nationalIdRegex.test(nationalId) || nationalId.length !== 10) throw new Error('身分證字號輸入錯誤')
      // check account 字數 <= 50
      if (account.length > 50) throw new Error('帳號請勿超過50字元')
      // check names 字數 <= 20
      if (firstName.length > 20) throw new Error('名字請勿超過20字元')
      if (lastName.length > 20) throw new Error('姓氏請勿超過20字元')
      if (nickName && nickName.length > 20) throw new Error('暱稱請勿超過20字元')
      // check email 字數 <= 100
      if (email.length > 100) throw new Error('email請勿超過100字元')
      // check phoneNumber === 10
      if (phoneNumber.length !== 10) throw new Error('手機格式輸入錯誤')
      // birthday & playSince日期不得為未來日
      const bd = new Date(birthdate)
      const pd = new Date(playSince)
      const now = new Date()
      if (bd.getTime() > now.getTime() || pd.getTime() > now.getTime()) throw new Error('生日&球齡日期不得晚於今天')
      // playSince日期不得晚於birthdate
      if (pd.getTime() < bd.getTime()) throw new Error('球齡不得大於出生年月日')
      // 檢查 account, email, nationalId, phoneNumber是否重複
      const connection = await pool.getConnection()
      if (!connection) throw new Error('DB connection fails.')
      const [existingUser] = await connection.query('SELECT * FROM users WHERE account = ? OR email = ? OR nationalId = ? OR phoneNumber = ?', [account, email, nationalId, phoneNumber])
      if (existingUser.length > 0) {
        if (existingUser[0].nationalId === nationalId) {
          throw new Error('National ID already exists!')
        } else if (existingUser[0].email === email) {
          throw new Error('Email already exists!')
        } else if (existingUser[0].account === account) {
          throw new Error('Account already exists!')
        } else if (existingUser[0].phoneNumber === phoneNumber) {
          throw new Error('Phone number already exists!')
        }
      }
      const hashedPassword = bcrypt.hashSync(password)
      const valuePlaceholder = [nationalId, email, account, password, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber].map(a => '?').join(', ')
      // 儲存使用者資料到資料庫
      await pool.query(`INSERT INTO users (nationalId, email, account, password, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber) VALUES (${valuePlaceholder})`, [nationalId, email, account, hashedPassword, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber])

      return res.status(201).json({ message: 'User registered successfully.' })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = userController

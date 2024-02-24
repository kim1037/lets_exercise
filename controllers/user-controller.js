const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userController = {
  signup: async (req, res, next) => {
    const { nationalId, email, account, password, checkPassword, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber } = req.body
    let connection
    try {
      // 檢查必填欄位是否有資料
      if (!nationalId || !email || !account || !password || !checkPassword || !firstName || !lastName || !gender || !birthdate || !phoneNumber) throw new Error('資料格式錯誤：請輸入完整資訊!')
      // check password
      if (password !== checkPassword) throw new Error('資料格式錯誤：確認密碼輸入不一致!')
      if (password.length > 20) throw new Error('資料格式錯誤：密碼不得超過20字元')
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
      if (!passwordRegex.test(password)) throw new Error('資料格式錯誤：密碼必須包含至少一個大寫英文及一個小寫英文和數字的組合，且最少為8字元')
      // 檢查身分證字號是否正確
      const nationalIdRegex = /^[A-Z]{1}[1-2]{1}[0-9]{8}$/
      if (!nationalIdRegex.test(nationalId) || nationalId.length !== 10) throw new Error('資料格式錯誤：身分證字號輸入錯誤')
      // check account 字數 <= 50
      if (account.length > 50) throw new Error('資料格式錯誤：帳號請勿超過50字元')
      // check names 字數 <= 20
      if (firstName.length > 20) throw new Error('資料格式錯誤：名字請勿超過20字元')
      if (lastName.length > 20) throw new Error('資料格式錯誤：姓氏請勿超過20字元')
      if (nickName && nickName.length > 20) throw new Error('資料格式錯誤：暱稱請勿超過20字元')
      // check email 字數 <= 100
      if (email.length > 100) throw new Error('資料格式錯誤：email請勿超過100字元')
      // check phoneNumber === 10
      if (phoneNumber.length !== 10) throw new Error('資料格式錯誤：手機格式輸入錯誤')
      if (playSince) {
        // birthday & playSince日期不得為未來日
        const bd = new Date(birthdate)
        const pd = new Date(playSince)
        const now = new Date()
        if (bd.getTime() > now.getTime() || pd.getTime() > now.getTime()) throw new Error('資料格式錯誤：生日&球齡日期不得晚於今天')
        // playSince日期不得晚於birthdate
        if (pd.getTime() < bd.getTime()) throw new Error('資料格式錯誤：球齡不得大於出生年月日')
        if (introduction && introduction.length > 150) throw new Error('資料格式錯誤：簡介請勿超過150字元')
      }

      // 檢查 account, email, nationalId, phoneNumber是否重複
      connection = await global.pool.getConnection()
      if (!connection) throw new Error('DB connection fails.')
      const [existingUser] = await connection.query('SELECT * FROM users WHERE account = ? OR email = ? OR nationalId = ? OR phoneNumber = ?', [account, email, nationalId, phoneNumber])
      connection.release()
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
      } else {
        // 資料庫找不到重複項目才能新增使用者
        const hashedPassword = bcrypt.hashSync(password) // 密碼加密
        const valuePlaceholder = [nationalId, email, account, password, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber].map(a => '?').join(', ')
        // 儲存使用者資料到資料庫
        await global.pool.query(`INSERT INTO users (nationalId, email, account, password, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber) VALUES (${valuePlaceholder})`, [nationalId, email, account, hashedPassword, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber])

        return res.status(201).json({ status: 'Success', message: 'User registered successfully.' })
      }
    } catch (err) {
      if (err.message.includes('資料格式錯誤')) {
        err.status = 400
      } else if (err.message.includes('already exists!')) {
        err.status = 409
      }
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  signin: async (req, res, next) => {
    try {
      const user = req.user
      // create a token
      const token = await jwt.sign(user, global.config.JWT_SECRET, { expiresIn: '30d' })

      return res.status(200).json({
        status: 'Success',
        data: {
          token,
          user
        }
      })
    } catch (err) {
      next(err)
    }
  },
  getUserData: async (req, res, next) => {
    let connection
    try {
      const id = Number(req.params.userId)
      connection = await global.pool.getConnection()

      // 待新增 -- 增加追蹤人數與粉絲的數量、rating平均值、參加過的活動次數

      const [user] = await connection.query('SELECT id, account, nickname, avatar, introduction, birthdate, playSince FROM users WHERE id = ?', [id])
      connection.release()
      if (!user || user.length === 0) {
        const err = new Error('使用者不存在!')
        err.status = 404
        throw err
      } else {
        return res.status(200).json({
          status: 'Success',
          data: {
            user: user[0]
          }
        })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  sample: async (req, res, next) => {
    let connection
    try {
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }
}

module.exports = userController

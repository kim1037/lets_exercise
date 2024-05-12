const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getOffset, getPagination } = require('../utils/paginator-helper')
const { imgurFileHandler } = require('../utils/file-helpers')
const { updateSQLFomatter } = require('../utils/data-helpers')
const dayjs = require('dayjs')

const userController = {
  signup: async (req, res, next) => {
    /*  #swagger.tags = ['Users']
        #swagger.description = '使用者註冊'
        #swagger.parameters['body'] = {
          in: 'body',
          description: 'User data.',
          schema: {
            $nationalId: "H223457572",
            $email: "testapi05@test.com",
            $account: "test005",
            $password: "Test00123",
            $checkPassword: "Test00123",
            $firstName: "Holly",
            $lastName: "Shit",
            $gender: "male",
            avatar: null,
            introduction: null,
            $birthdate: "2022/01/01",
            playSince: "2023/10/01",
            $phoneNumber:"0912425355"
        }
      }
    */
    let { nationalId, email, account, password, checkPassword, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber } = req.body
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
      // check account 字數 <= 50, >= 5
      if (account.length > 50 || account.length < 5) throw new Error('資料格式錯誤：帳號長度請設在5~50字元內')
      // check names 字數 <= 20
      if (firstName.length > 20) throw new Error('資料格式錯誤：名字請勿超過20字元')
      if (lastName.length > 20) throw new Error('資料格式錯誤：姓氏請勿超過20字元')
      if (nickName && nickName.length > 20) throw new Error('資料格式錯誤：暱稱請勿超過20字元')
      // check email 字數 <= 100
      if (email.length > 100) throw new Error('資料格式錯誤：email請勿超過100字元')
      // check phoneNumber === 10
      if (phoneNumber.length !== 10) throw new Error('資料格式錯誤：手機格式輸入錯誤')
      // 驗證性別
      if (gender && ((gender === 'male' && nationalId[1] !== '1') || (gender === 'female' && nationalId[1] !== '2'))) throw new Error('資料格式錯誤：性別與身分證不相符')

      // birthday & playSince日期不得為未來日
      const bd = new Date(birthdate)
      const pd = new Date(playSince)
      const now = new Date()
      if (bd.getTime() > now.getTime() || (playSince && pd.getTime() > now.getTime())) throw new Error('資料格式錯誤：生日&球齡日期不得晚於今天')
      // playSince日期不得晚於birthdate
      if (playSince && (pd.getTime() < bd.getTime())) throw new Error('資料格式錯誤：球齡不得早於出生年月日')

      if (introduction && introduction.length > 150) throw new Error('資料格式錯誤：簡介請勿超過150字元')
      // 檢查 account, email, nationalId, phoneNumber是否重複
      connection = await global.pool.getConnection()
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
      } else {
        // 資料庫找不到重複項目才能新增使用者
        const hashedPassword = bcrypt.hashSync(password) // 密碼加密
        const valuePlaceholder = [nationalId, email, account, password, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber].map(a => '?').join(', ')
        birthdate = dayjs(birthdate, 'Asia/Taipei').format('YYYY-MM-DD')
        playSince = playSince ? dayjs(playSince, 'Asia/Taipei').format('YYYY-MM-DD') : null
        // 儲存使用者資料到資料庫
        await global.pool.query(`INSERT INTO users (nationalId, email, account, password, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber) VALUES (${valuePlaceholder})`, [nationalId, email, account, hashedPassword, firstName, lastName, nickName, gender, avatar, introduction, birthdate, playSince, phoneNumber])

        // #swagger.responses[201] = { status: 'Success', message: 'User registered successfully.' }
        return res.status(201).json({ status: 'Success', message: 'User registered successfully.' })
      }
    } catch (err) {
      if (err.message.includes('資料格式錯誤')) {
        /* #swagger.responses[422] = { status: "error", statusCode: 422, error: "資料格式錯誤：錯誤訊息"} */
        err.status = 422
      } else if (err.message.includes('already exists!')) {
        // #swagger.responses[409] = { status: "error", statusCode: 409, error: "Some column already exists!"}
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
    /*  #swagger.tags = ['Users']
        #swagger.description = '使用者登入'
        #swagger.parameters['body'] = {
          in: 'body',
          description: 'User data.',
          schema: {
            $account: "test005",
            $password: "Test00123"
          }
        }
    */
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
    // #swagger.tags = ['Users']
    // #swagger.description = '取得使用者資訊，包含粉絲人數、追蹤人數、參加過的活動次數以及創立過的活動數量'
    let connection
    try {
      const id = Number(req.params.userId)
      connection = await global.pool.getConnection()

      // 待新增 -- rating平均值

      const sql = `SELECT u.id, u.account, u.nickname, u.avatar, u.introduction, u.birthdate, u.playSince , COUNT(p.userId) AS participationCount, 
      (SELECT COUNT(*) FROM followships WHERE followerId = u.id) AS followingCount,
      (SELECT COUNT(*) FROM followships WHERE followingId = u.id) AS followerCount,
      (SELECT COUNT(*) FROM activities WHERE hostId = u.id) AS activityHostCount
      FROM users as u
      LEFT JOIN participants as p ON u.id = p.userId
      WHERE u.id = ?
      GROUP BY u.id`
      const [user] = await connection.query(sql, [id])
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
  getParticipants: async (req, res, next) => {
    // #swagger.tags = ['Users']
    // #swagger.description = ' 查看某個使用者參加過的活動'
    // 查看某個使用者參加過的活動 => participants.userId = users.id
    // 目前設定僅能查看自己的資料
    let connection
    const page = Number(req.query.page) || 1 // 初始預設頁
    const limit = Number(req.query.limit) || 10 // default 每頁10筆
    const offset = getOffset(limit, page)
    try {
      const currentUserId = req.user.id
      const userId = req.params.userId
      if (currentUserId !== Number(userId)) {
        const err = new Error('你沒有權限查看其他使用者的資料')
        err.status = 401
        throw err
      }
      connection = await global.pool.getConnection()
      // find the total numbers of participants
      const [amount] = await connection.query('SELECT COUNT(*) AS total FROM participants WHERE userId =?', [userId])
      const totalAmount = amount[0].total
      if (offset > totalAmount) {
        const err = new Error(`資料頁碼超過範圍，此條件只有${Math.ceil(totalAmount / limit)}頁`)
        err.status = 404
        throw err
      }
      // get activity data
      const [participants] = await connection.query(`SELECT a.*, ar.name AS arenaName, s.name AS shuttlecockName, r.region FROM participants AS p 
        JOIN activities AS a ON a.id = p.activityId
        JOIN users AS u ON u.id = a.hostId
        JOIN arenas AS ar ON ar.id = a.arenaId
        JOIN regions AS r ON ar.regionId = r.id
        JOIN shuttlecocks AS s ON s.id = a.shuttlecockId
        WHERE p.userId = ? LIMIT ${limit} OFFSET ${offset}`, [userId])
      if (!participants || participants.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未參加過任何活動' })
      } else {
        return res.status(200).json({ status: 'Success', pagination: getPagination(limit, page, totalAmount), data: participants })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  getActivities: async (req, res, next) => {
    // #swagger.tags = ['Activities']
    // #swagger.description = ' 查看某個使用者開過的活動'
    // 查看某個使用者開過的活動 => activities.hostId = users.id
    // 目前設定僅能查看自己的資料
    let connection
    const page = Number(req.query.page) || 1 // 初始預設頁
    const limit = Number(req.query.limit) || 10 // default 每頁10筆
    const offset = getOffset(limit, page)
    try {
      const currentUserId = req.user.id
      const userId = req.params.userId
      if (currentUserId !== Number(userId)) {
        const err = new Error('你沒有權限查看其他使用者的資料')
        err.status = 401
        throw err
      }
      connection = await global.pool.getConnection()
      // find the total numbers of activities
      const [amount] = await connection.query('SELECT COUNT(*) AS total FROM activities WHERE hostId =?', [userId])
      const totalAmount = amount[0].total
      if (offset > totalAmount) {
        const err = new Error(`資料頁碼超過範圍，此條件只有${Math.ceil(totalAmount / limit)}頁`)
        err.status = 404
        throw err
      }
      // get activity data
      const [activities] = await connection.query(`SELECT a.*, ar.name AS arenaName, s.name AS shuttlecockName, r.region FROM activities AS a
        JOIN arenas AS ar ON ar.id = a.arenaId
        JOIN regions AS r ON ar.regionId = r.id
        JOIN shuttlecocks AS s ON s.id = a.shuttlecockId
        WHERE a.hostId = ? LIMIT ${limit} OFFSET ${offset}`, [userId])
      if (!activities || activities.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未參加過任何活動' })
      } else {
        return res.status(200).json({ status: 'Success', pagination: getPagination(limit, page, totalAmount), data: activities })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  editUserProfile: async (req, res, next) => {
    // #swagger.tags = ['Users']
    // #swagger.description = '編輯使用者資訊，修改密碼、大頭貼請用另一支api'

    let connection
    // 由於有加入第三方認證(通常只會有email)，因此若已有帳號、身分證、手機者不得更改這三個資料，性別也要驗證
    let { nationalId, account, firstName, lastName, nickName, gender, introduction, birthdate, playSince, phoneNumber } = req.body
    try {
      const currentUserId = req.user.id
      const userId = req.params.userId
      if (currentUserId !== Number(userId)) {
        const err = new Error('你沒有權限修改其他使用者的資料')
        err.status = 401
        throw err
      }

      connection = await global.pool.getConnection()
      if (!connection) throw new Error('DB connection fails.')

      // 找出使用者資料
      const [user] = await connection.query('SELECT nationalId, account, firstName, lastName, nickName, gender, introduction, birthdate, playSince, phoneNumber FROM users WHERE id = ?', [currentUserId])

      if ((user[0].nationalId && nationalId) || (user[0].account && account) || (user[0].phoneNumber && phoneNumber)) {
        const err = new Error('身分證、帳號、手機號碼若已存在則無法修改!')
        err.status = 409
        throw err
      }

      // nationalId, account, firstName, lastName, gender, birthdate, phoneNumber 為必填欄位，若本來沒有設定則不得為空白
      if ((!user[0].nationalId && !nationalId) || (!user[0].account && !account) || (!user[0].phoneNumber && !phoneNumber) || (!user[0].firstName && !firstName) || (!user[0].lastName && !lastName) || (!user[0].gender && !gender) || (!user[0].birthdate && !birthdate)) {
        const err = new Error('請確實填寫必填欄位，不得為空白！')
        err.status = 422
        throw err
      }

      if (nationalId) {
        // 檢查身分證字號是否正確
        const nationalIdRegex = /^[A-Z]{1}[1-2]{1}[0-9]{8}$/
        if (!nationalIdRegex.test(nationalId) || nationalId.length !== 10) throw new Error('資料格式錯誤：身分證字號輸入錯誤')
      }

      // 驗證性別
      if (gender) {
        const checkGender = nationalId ? (nationalId[1] === '1' ? 'male' : 'female') : (user[0].nationalId[1] === '1' ? 'male' : 'female')
        if (gender !== checkGender) throw new Error('資料格式錯誤：性別與身分證不相符')
      }

      // check account 字數 <= 50
      if (account.length > 50 || account.length < 5) throw new Error('資料格式錯誤：帳號長度請設在5~50字元內')

      // check names 字數 <= 20
      if (firstName && firstName.length > 20) throw new Error('資料格式錯誤：名字請勿超過20字元')
      if (lastName && lastName.length > 20) throw new Error('資料格式錯誤：姓氏請勿超過20字元')
      if (nickName && nickName.length > 20) throw new Error('資料格式錯誤：暱稱請勿超過20字元')

      // check phoneNumber === 10
      if (phoneNumber && phoneNumber.length !== 10) throw new Error('資料格式錯誤：手機格式輸入錯誤')

      // birthday & playSince日期不得為未來日
      const now = new Date()
      const bd = birthdate ? new Date(birthdate) : new Date(user[0].birthdate)
      if (birthdate) {
        if (bd.getTime() > now.getTime()) throw new Error('資料格式錯誤：生日日期不得晚於今天')
        birthdate = dayjs(birthdate, 'Asia/Taipei').format('YYYY-MM-DD')
      }

      if (playSince) {
        const pd = new Date(playSince)
        if (playSince && pd.getTime() > now.getTime()) throw new Error('資料格式錯誤：球齡日期不得晚於今天')
        // playSince日期不得晚於birthdate
        if (playSince && (pd.getTime() < bd.getTime())) throw new Error('資料格式錯誤：球齡不得早於出生年月日')
        playSince = playSince ? dayjs(playSince, 'Asia/Taipei').format('YYYY-MM-DD') : null
      }

      if (introduction && introduction.length > 150) throw new Error('資料格式錯誤：簡介請勿超過150字元')

      // 檢查 account, nationalId, phoneNumber是否重複
      const [existingUser] = await connection.query('SELECT * FROM users WHERE account = ? OR nationalId = ? OR phoneNumber = ?', [account, nationalId, phoneNumber])
      if (existingUser.length > 0) {
        if (existingUser[0].nationalId === nationalId) {
          throw new Error('National ID already exists!')
        } else if (existingUser[0].account === account) {
          throw new Error('Account already exists!')
        } else if (existingUser[0].phoneNumber === phoneNumber) {
          throw new Error('Phone number already exists!')
        }
      } else {
        const columnsObj = { nationalId, account, firstName, lastName, nickName, gender, introduction, birthdate, playSince, phoneNumber }
        const updateStr = updateSQLFomatter(columnsObj)
        // 更新使用者資料
        const sql = `UPDATE users SET ${updateStr} WHERE id = ?`
        await connection.query(sql, [currentUserId])

        // #swagger.responses[200] = { status: 'Success', message: 'User registered successfully.' }
        return res.status(200).json({ status: 'Success', message: 'User data update successfully.' })
      }
    } catch (err) {
      if (err.message.includes('資料格式錯誤')) {
        /* #swagger.responses[422] = { status: "error", statusCode: 422, error: "資料格式錯誤：錯誤訊息"} */
        err.status = 422
      } else if (err.message.includes('already exists!')) {
        // #swagger.responses[409] = { status: "error", statusCode: 409, error: "Some column already exists!"}
        err.status = 409
      }
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  editUserAvatar: async (req, res, next) => {
    // #swagger.tags = ['Users']
    // #swagger.description = 'Edit user avatar. Remember to add enctype attribute to the form and the input type of avatar should be file.'
    let connection
    const { file } = req
    try {
      const currentUserId = req.user.id
      const userId = req.params.userId

      if (currentUserId !== Number(userId)) {
        const err = new Error('你沒有權限修改其他使用者的資料')
        err.status = 401
        throw err
      }

      connection = await global.pool.getConnection()
      const [user] = await connection.query('SELECT id, avatar FROM users WHERE id = ?', [currentUserId])
      if (!user || user.length === 0) {
        const err = new Error('使用者不存在!')
        err.status = 404
        throw err
      }
      const avatar = file ? await imgurFileHandler(file) : user[0].avatar
      await connection.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, currentUserId])

      return res.status(200).json({ status: 'Success', message: 'User avatar update successfully.' })
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  editPassword: async (req, res, next) => {
    // #swagger.tags = ['Users']
    // #swagger.description = '編輯使用者密碼'
    let connection
    const { oldPassword, newPassword, checkPassword } = req.body
    try {
      const currentUserId = req.user.id
      const userId = req.params.userId

      if (currentUserId !== Number(userId)) {
        const err = new Error('你沒有權限修改其他使用者的資料')
        err.status = 401
        throw err
      }
      connection = await global.pool.getConnection()
      if (!connection) throw new Error('DB connection fails.')

      // 找出使用者資料
      const [user] = await connection.query('SELECT password FROM users WHERE id = ?', [currentUserId])
      if (!user || user.length === 0) {
        const err = new Error('使用者不存在!')
        err.status = 404
        throw err
      }

      if (!bcrypt.compareSync(oldPassword, user[0].password)) {
        const err = new Error('舊密碼輸入錯誤，請重新輸入')
        err.status = 401
        throw err
      }

      // check password
      if (newPassword !== checkPassword) throw new Error('資料格式錯誤：確認密碼輸入不一致!')
      if (newPassword.length > 20) throw new Error('資料格式錯誤：密碼不得超過20字元')
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
      if (!passwordRegex.test(newPassword)) throw new Error('資料格式錯誤：密碼必須包含至少一個大寫英文及一個小寫英文和數字的組合，且最少為8字元')

      const password = bcrypt.hashSync(newPassword) // 密碼加密
      await connection.query('UPDATE users SET password = ? WHERE id = ?', [password, currentUserId])

      return res.status(200).json({ status: 'Success', message: 'User password update successfully.' })
    } catch (err) {
      if (err.message.includes('資料格式錯誤')) {
        /* #swagger.responses[422] = { status: "error", statusCode: 422, error: "資料格式錯誤：錯誤訊息"} */
        err.status = 422
      }
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  sample: async (req, res, next) => {
    // #swagger.ignore = true
    let connection
    try {
      connection = await global.pool.getConnection()
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

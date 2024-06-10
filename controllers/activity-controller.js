const { getOffset, getPagination } = require('../utils/paginator-helper')
const { updateSQLFomatter } = require('../utils/data-helpers')
const dayjs = require('dayjs')

const activityController = {
  create: async (req, res, next) => {
    // #swagger.tags = ['Activities']
    let { arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, levelId, fee, numsOfPeople, totalPeople, description } = req.body
    let connection
    try {
      const currentUserId = req.user.id
      connection = await global.pool.getConnection()
      // 需要加入一些條件判斷避免重複創建? 時間地點重複就要，看要不要新增場地數量的欄位
      if (!arenaId || !date || !levelId || !fee || !numsOfPeople || !totalPeople || !timeStart || !timeEnd) {
        const err = new Error('資料格式錯誤：請填寫所有必填欄位!')
        err.status = 422
        throw err
      }
      // 無法重複創建活動 => 同地點、同日期、同時間
      const [activity] = await connection.query('SELECT * FROM activities WHERE arenaId =? AND hostId = ? AND date = ? AND timeStart = ? AND timeEnd =?', [arenaId, currentUserId, date, timeStart, timeEnd])
      if (activity.length > 0) {
        const err = new Error('無法重複創建活動：你已在同日期、時間及地點建立過活動！')
        err.status = 409
        throw err
      }

      // 日期不得早於創建日，時間只能創下一小時的活動 EX: 20:20創 20:30-59分之間都不行，但21:00之後可以
      // 格式化日期
      date = dayjs(date, 'Asia/Taipei').format('YYYY-MM-DD')
      const now = dayjs(new Date(), 'Asia/Taipei').format()
      if ((date < dayjs(now).format('YYYY-MM-DD')) || (date === dayjs(now).format('YYYY-MM-DD') && Number(timeStart.slice(0, 2)) <= dayjs(now).hour())) {
        const err = new Error('資料格式錯誤：日期不得早於現在時間!')
        err.status = 422
        throw err
      }

      const [user] = await connection.query('SELECT id FROM users WHERE id = ?', [currentUserId])
      if (!user || user.length === 0) {
        const err = new Error('使用者不存在!')
        err.status = 404
        throw err
      }
      const values = [currentUserId, arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, levelId, fee, numsOfPeople, totalPeople, description]
      const valuesPlacholder = values.map(c => '?').join(', ')
      // create activity
      await connection.query(`INSERT INTO activities (hostId, arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, levelId, fee, numsOfPeople, totalPeople, description) VALUES(${valuesPlacholder})`, values)

      return res.status(201).json({ status: 'Success', message: '成功建立活動!' })
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  edit: async (req, res, next) => {
    // #swagger.tags = ['Activities']
    let connection
    let { arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, levelId, fee, numsOfPeople, totalPeople, description } = req.body
    const { activityId } = req.params
    try {
      connection = await global.pool.getConnection()
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ?', [activityId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }

      // 只能編輯自己建立的活動
      const currentUserId = req.user.id
      if (activity[0].hostId !== currentUserId) {
        const err = new Error('你無權編輯此活動!')
        err.status = 401
        throw err
      }

      date = date ? dayjs(date, 'Asia/Taipei').format('YYYY-MM-DD') : dayjs(activity[0].date, 'Asia/Taipei').format('YYYY-MM-DD')
      timeStart = timeStart || activity[0].timeStart
      timeEnd = timeEnd || activity[0].timeEnd

      const now = dayjs(new Date(), 'Asia/Taipei').format()
      if ((date < dayjs(now).format('YYYY-MM-DD')) || (date === dayjs(now).format('YYYY-MM-DD') && Number(timeStart.slice(0, 2)) <= dayjs(now).hour())) {
        const err = new Error('資料格式錯誤：日期不得早於現在時間!')
        err.status = 422
        throw err
      }

      if ((shuttlecockProvide === false) || !activity[0].shuttlecockProvide) shuttlecockId = null // 若不提供球, 羽球型號則為null
      const columnsObj = { arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, levelId, fee, numsOfPeople, totalPeople, description }
      const updateStr = updateSQLFomatter(columnsObj)
      const sql = `UPDATE activities SET ${updateStr} WHERE id = ?`
      await connection.query(sql, [activityId])
      return res.status(200).json({ status: 'Success', message: '成功修改活動!' })
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  delete: async (req, res, next) => {
    // #swagger.tags = ['Activities']
    const { activityId } = req.params
    let connection
    try {
      const currentUserId = req.user.id
      connection = await global.pool.getConnection()
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ?', [activityId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }
      // 只能刪除自己建立的活動
      if (activity[0].hostId !== currentUserId) {
        const err = new Error('你無權刪除此活動!')
        err.status = 401
        throw err
      }
      const [result] = await connection.query('DELETE FROM activities WHERE id = ? AND hostId = ?', [activityId, currentUserId])
      if (!result || result.length === 0) {
        const err = new Error('無法刪除此筆資料！')
        err.status = 404
        throw err
      } else {
        return res.status(200).json({ status: 'Success', message: '已刪除活動!' })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  getAll: async (req, res, next) => {
    // #swagger.tags = ['Activities']
    // 揪團資訊可篩選、排序，預設為日期排序：新->舊
    // 已新增地區篩選、顯示每頁筆數篩選
    let connection
    const page = Number(req.query.page) || 1 // 初始預設頁
    const limit = Number(req.query.limit) || 10 // default 每頁10筆
    const regionId = req.query.regionId || '' // 篩選: 依縣市篩
    const offset = getOffset(limit, page)
    try {
      const currentUserId = req.user ? req.user.id : 0
      connection = await global.pool.getConnection()
      // find the total numbers of activities
      const [amount] = await connection.query(`SELECT COUNT(*) AS total FROM activities AS a 
      JOIN arenas AS ar ON a.arenaId = ar.id 
      JOIN regions AS r ON ar.regionId = r.id
      WHERE a.date >= CURDATE() - INTERVAL 7 DAY 
      ${regionId ? 'AND regionId = ?' : ''}`, (regionId ? [regionId] : []))
      const totalAmount = amount[0].total
      if (offset > totalAmount) {
        const err = new Error(`資料頁碼超過範圍，此條件只有${Math.ceil(totalAmount / limit)}頁`)
        err.status = 404
        throw err
      }

      let activity = []
      if (currentUserId) {
        [activity] = await connection.query(`SELECT a.*, u.nickName AS hostName, u.gender, u.avatar, ar.name AS arenaName, s.name AS shuttlecockName, r.region, r.id AS regionId, 
        CASE WHEN p.userId IS NOT NULL THEN TRUE ELSE FALSE END AS isCurrentUserJoin 
        FROM activities AS a 
        JOIN users AS u ON u.id = a.hostId
        JOIN arenas AS ar ON ar.id = a.arenaId
        JOIN regions AS r ON ar.regionId = r.id
        JOIN shuttlecocks AS s ON s.id = a.shuttlecockId
        LEFT JOIN  (
          SELECT *
          FROM participants
          WHERE userId = ?
        ) AS p ON a.id = p.activityId 
        WHERE a.date >= CURDATE() - INTERVAL 7 DAY 
        ${regionId ? 'AND ar.regionId = ?' : ''}
        ORDER BY a.date DESC, a.timeStart ASC
        LIMIT ${limit} OFFSET ${offset}`, (regionId ? [currentUserId, regionId] : [currentUserId]))
      } else {
        [activity] = await connection.query(`SELECT a.*, u.nickName AS hostName, u.gender, u.avatar, ar.name AS arenaName, r.region, r.id AS regionId,  s.name AS shuttlecockName
        FROM activities AS a 
        JOIN users AS u ON u.id = a.hostId
        JOIN arenas AS ar ON ar.id = a.arenaId
        JOIN regions AS r ON ar.regionId = r.id
        JOIN shuttlecocks AS s ON s.id = a.shuttlecockId
        WHERE a.date >= CURDATE() - INTERVAL 7 DAY 
        ${regionId ? 'AND ar.regionId = ?' : ''}
        ORDER BY a.date DESC, a.timeStart ASC
        LIMIT ${limit} OFFSET ${offset}`, (regionId ? [regionId] : []))
      }

      if (!activity || activity.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前還沒有任何活動喔!' })
      } else {
        const result = activity.map(a => {
          a.isCurrentUserJoin = !!a.isCurrentUserJoin
          a.shuttlecockProvide = !!a.shuttlecockProvide
          return a
        })
        return res.status(200).json({ status: 'Success', pagination: getPagination(limit, page, totalAmount), data: result })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  getActivity: async (req, res, next) => {
    // #swagger.tags = ['Activities']
    let connection
    try {
      const { activityId } = req.params
      const currentUserId = req.user ? req.user.id : 0
      connection = await global.pool.getConnection()
      let activity = []

      if (currentUserId) {
        [activity] = await connection.query(`SELECT a.*,  u.nickName AS hostName, u.gender, u.avatar, ar.name AS arenaName, s.name AS shuttlecockName, 
        CASE WHEN p.userId IS NOT NULL THEN TRUE ELSE FALSE END AS isCurrentUserJoin 
        FROM activities AS a 
        JOIN users AS u ON u.id = a.hostId
        JOIN arenas AS ar ON ar.id = a.arenaId
                JOIN shuttlecocks AS s ON s.id = a.shuttlecockId
        LEFT JOIN (
          SELECT *
          FROM participants
          WHERE userId = ?
        ) AS p ON a.id = p.activityId
        WHERE a.id = ?`, [currentUserId, activityId])
      } else {
        [activity] = await connection.query(`SELECT a.*,  u.nickName AS hostName, u.gender, u.avatar, ar.name AS arenaName, s.name AS shuttlecockName
        FROM activities AS a 
        JOIN users AS u ON u.id = a.hostId
        JOIN arenas AS ar ON ar.id = a.arenaId
                JOIN shuttlecocks AS s ON s.id = a.shuttlecockId
        WHERE a.id = ?`, [activityId])
      }
      // 檢查活動是否存在
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }
      // 多給一個確認目前登入使用者已報名的值: isCurrentUserJoin
      activity[0].isCurrentUserJoin = !!activity[0].isCurrentUserJoin
      activity[0].shuttlecockProvide = !!activity[0].shuttlecockProvide
      return res.status(200).json({ status: 'Success', data: activity[0] })
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  postParticipant: async (req, res, next) => {
    // #swagger.tags = ['Participants']

    let { activityId } = req.params
    let connection
    activityId = Number(activityId)
    try {
      const currentUserId = req.user.id
      connection = await global.pool.getConnection()
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ?', [activityId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }
      // 不能參加自己開的團
      if (activity[0].hostId === currentUserId) {
        const err = new Error('你不能參加自己建立的活動!')
        err.status = 400
        throw err
      }
      // 報名人數已滿的話不能報名
      if (activity[0].currentJoinNums === activity[0].numsOfPeople) {
        return res.status(200).json({ message: '報名失敗，此活動人數已滿!' })
      }

      // 查詢participants table
      const [participants] = await connection.query('SELECT p.userId AS participantId, a.* FROM participants AS p JOIN activities AS a ON p.activityId = a.id WHERE p.userId = ?', [currentUserId])
      // 檢查是否已報過同一個活動
      const isJoin = participants.find(p => p.id === activityId)
      if (isJoin) {
        const err = new Error('你已報名過此活動!')
        err.status = 409
        throw err
      }
      // 檢查已報名的活動中是否已有其他活動時間衝突
      let { date, timeStart, timeEnd } = activity[0]
      date = date.toISOString().substring(0, 10)

      const timeConflict = participants.some(p => {
        if (date === p.date.toISOString().substring(0, 10)) {
          if ((p.timeStart < timeEnd && p.timeStart > timeStart) || (p.timeEnd > timeStart || p.timeEnd < timeEnd)) {
            return true
          }
        }
        return false
      })
      if (timeConflict) {
        const err = new Error('此段時間你已報名其他活動!')
        err.status = 409
        throw err
      }
      // 報名活動
      await connection.query('INSERT INTO participants (activityId, userId) VALUES(?, ?)', [activityId, currentUserId])
      await connection.query(`UPDATE activities SET currentJoinNums = ${activity[0].currentJoinNums + 1} WHERE id = ?`, [activityId])

      return res.status(201).json({ status: 'Success', message: '報名成功!' })
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  deleteParticipant: async (req, res, next) => {
    // #swagger.tags = ['Participants']
    const { activityId } = req.params
    let connection
    try {
      const currentUserId = req.user.id
      connection = await global.pool.getConnection()
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ?', [activityId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }
      // 檢查是否已報過這個活動
      const [participant] = await connection.query('SELECT * FROM participants WHERE userId = ? AND activityId = ?', [currentUserId, activityId])

      if (!participant || participant.length === 0) {
        const err = new Error('尚未報名過此活動!')
        err.status = 404
        throw err
      }
      // 不能刪除不是自己的報名紀錄
      if (participant[0].userId !== currentUserId) {
        const err = new Error('不能刪除別人的參加紀錄!')
        err.status = 401
        throw err
      }
      // 刪除此活動的報名
      const [result] = await connection.query('DELETE FROM participants WHERE userId = ? AND activityId = ?', [currentUserId, activityId])
      // 若刪除筆數為0則回傳錯誤訊息
      if (!result || result.length === 0) {
        const err = new Error('無法刪除此筆資料！')
        err.status = 404
        throw err
      } else {
        await connection.query(`UPDATE activities SET currentJoinNums = ${activity[0].currentJoinNums - 1} WHERE id = ?`, [activityId])

        return res.status(200).json({ status: 'Success', message: '已取消報名!' })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }
}

module.exports = activityController

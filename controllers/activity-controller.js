const activityController = {
  create: async (req, res, next) => {
    let { arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description } = req.body
    let connection
    try {
      const currentUserId = req.user.id
      // 需要加入一些條件判斷避免重複創建? 時間地點重複就要，看要不要新增場地數量的欄位
      if (!arenaId || !date || !level || !fee || !numsOfPeople || !totalPeople || !timeStart || !timeEnd) {
        const err = new Error('請填寫所有必填欄位!')
        err.status = 400
        throw err
      }
      // 輸入欄位格式檢查?
      // 日期不得早於創建日
      date = new Date(date) // 格式化日期
      const now = new Date()
      if (date < now) {
        const err = new Error('日期不得早於現在時間!')
        err.status = 400
        throw err
      }
      connection = await global.pool.getConnection()
      const [user] = await connection.query('SELECT id FROM users WHERE id = ?', [currentUserId])
      if (!user || user.length === 0) {
        const err = new Error('使用者不存在!')
        err.status = 404
        throw err
      }
      const values = [currentUserId, arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description]
      const valuesPlacholder = values.map(c => '?').join(', ')
      // create activity
      await connection.query(`INSERT INTO activities (userId, arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description) VALUES(${valuesPlacholder})`, values)

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
    const { activityId } = req.params
    let { arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description } = req.body
    let connection
    try {
      if (!shuttlecockProvide) shuttlecockId = null // 若不提供球, 羽球型號則為null
      const columnsObj = { arenaId, shuttlecockId, date, timeStart, timeEnd, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description }
      const columnLength = Object.keys(columnsObj).length
      // 過濾出存在的屬性
      let count = 0
      let updateColumns = ''
      for (const [key, value] of Object.entries(columnsObj)) {
        count += 1
        if (key && value !== undefined) {
          updateColumns += `${key} = ${typeof value === 'number' ? value : typeof value === 'string' ? `'${value}'` : value}${count < columnLength ? ',' : ''}`
        }
      }
      connection = await global.pool.getConnection()
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ?', [activityId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }
      const sql = `UPDATE activities SET ${updateColumns} WHERE id = ?`
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
    const { activityId } = req.params
    const currentUserId = req.user.id
    let connection
    try {
      connection = await global.pool.getConnection()
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ? AND userId = ?', [activityId, currentUserId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }
      const [result] = await connection.query('DELETE FROM activities WHERE id = ? AND userId = ?', [activityId, currentUserId])
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
    // 揪團資訊可篩選、排序，預設為日期排序：新->舊
    // 待加上關聯：場地、羽球型號、開團者
    // 篩選，時間留目前為止前七天的資料就好
    let connection
    try {
      const currentUserId = req.user.id
      connection = await global.pool.getConnection()
      const [activity] = await connection.query(`SELECT a.*,  
      CASE WHEN p.userId IS NOT NULL THEN TRUE ELSE FALSE END AS isCurrentUserJoin 
      FROM activities AS a 
      LEFT JOIN  (
        SELECT *
        FROM participants
        WHERE userId = ?
      ) AS p ON a.id = p.activityId `, [currentUserId])
      // iscurrent有bug
      if (!activity || activity.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前還沒有任何活動喔!' })
      } else {
        const result = activity.map(a => {
          a.isCurrentUserJoin = !!a.isCurrentUserJoin
          a.shuttlecockProvide = !!a.shuttlecockProvide
          return a
        })
        return res.status(200).json({ status: 'Success', data: result })
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
    let connection
    try {
      const { activityId } = req.params
      const currentUserId = req.user.id
      connection = await global.pool.getConnection()
      const [activity] = await connection.query(`SELECT a.*,  
      CASE WHEN p.userId IS NOT NULL THEN TRUE ELSE FALSE END AS isCurrentUserJoin
      FROM activities AS a 
      LEFT JOIN (
        SELECT *
        FROM participants
        WHERE userId = ?
      ) AS p ON a.id = p.activityId
      WHERE a.id = ?`, [currentUserId, activityId])
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
    let { activityId } = req.params
    let connection
    activityId = Number(activityId)
    try {
      const userId = req.user.id
      connection = await global.pool.getConnection()
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ?', [activityId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }
      const [participants] = await connection.query('SELECT p.userId AS participantId, a.* FROM participants AS p JOIN activities AS a ON p.activityId = a.id WHERE p.userId = ?', [userId])
      // 檢查是否已報過同一個活動
      const isJoin = participants.find(p => p.id === activityId)
      if (isJoin) {
        const err = new Error('你已報名過此活動!')
        err.status = 409
        throw err
      }
      let { date, timeStart, timeEnd } = activity[0]
      date = date.toISOString().substring(0, 10)

      // 檢查已報名的活動中是否已有其他活動時間衝突
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
      const postParticipant = await connection.query('INSERT INTO participants (activityId, userId) VALUES(?, ?)', [activityId, userId])
      console.log(postParticipant)

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
      // 刪除此活動的報名
      const [result] = await connection.query('DELETE FROM participants WHERE userId = ? AND activityId = ?', [currentUserId, activityId])
      // 若刪除筆數為0則回傳錯誤訊息
      if (!result || result.length === 0) {
        const err = new Error('無法刪除此筆資料！')
        err.status = 404
        throw err
      } else {
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

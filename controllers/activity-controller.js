const activityController = {
  create: async (req, res, next) => {
    let { arenaId, shuttlecockId, date, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description } = req.body
    let connection
    try {
      const userId = req.user.id
      // 需要加入一些條件判斷避免重複創建? 待討論
      if (!arenaId || !date || !level || !fee || !numsOfPeople || !totalPeople) {
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
      const [user] = await connection.query('SELECT id FROM users WHERE id = ?', [userId])
      if (!user || user.length === 0) {
        const err = new Error('使用者不存在!')
        err.status = 404
        throw err
      }
      const values = [userId, arenaId, shuttlecockId, date, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description]
      const valuesPlacholder = values.map(c => '?').join(', ')
      // create activity
      await connection.query(`INSERT INTO activities (userId, arenaId, shuttlecockId, date, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description) VALUES(${valuesPlacholder})`, values)

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
    let { arenaId, shuttlecockId, date, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description } = req.body
    let connection
    // const cloumnsName = ['arenaId', 'shuttlecockId', 'date', 'shuttlecockProvide', 'level', 'fee', 'numsOfPeople', 'totalPeople', 'description'];
    if (!shuttlecockProvide) shuttlecockId = null // 若不提供球, 羽球型號則為null
    const columnsObj = { arenaId, shuttlecockId, date, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description }
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
    console.log(updateColumns) // 檢查sql是否有誤

    try {
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
    let connection
    try {
      connection = await global.pool.getConnection()
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ?', [activityId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
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
  },
  getActivity: async (req, res, next) => {
    const { activityId } = req.params
    let connection
    try {
      connection = await global.pool.getConnection()
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ?', [activityId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  postParticipant: async (req, res, next) => {
    const { activityId } = req.params
    let connection
    try {
      // 檢查活動是否存在
      const [activity] = await connection.query('SELECT * FROM activities WHERE id = ?', [activityId])
      if (!activity || activity.length === 0) {
        const err = new Error('找不到此活動!')
        err.status = 404
        throw err
      }
      // 檢查是否已報過同一個活動
      // 檢查已報名的活動中是否已有其他活動時間衝突
      connection = await global.pool.getConnection()
    } catch (err) {
      next(err)
    }
  },
  deleteParticipant: async (req, res, next) => {
    const { activityId } = req.params
    const currentUserId = req.user.id
    let connection
    try {
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
      if (participant || participant.length > 0) {
        const err = new Error('尚未報名過此活動!')
        err.status = 404
        throw err
      }
      // 刪除此活動的報名
      const [result] = await connection.query('DELETE FROM participants WHERE userId = ? AND acitvityId = ?', [userId, activityId])
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

const followshipController = {
  postFollowship: async (req, res, next) => {
    const { followingId } = req.params
    const currentUserId = req.user.id
    let connection
    try {
      // cannot follow self
      if (Number(followingId) === currentUserId) {
        const err = new Error('不可以追蹤及取消追蹤自己!')
        err.status = 409
        throw err
      }

      // 合併的sql, 須測試
      // SELECT users.id FROM users LEFT JOIN followships ON users.id = followships.followingId AND followships.followerId = ? WHERE users.id = ? [currentUserId, followingId]
      // 找不到資料 -> 1. 使用者不存在 2.沒有追蹤過

      connection = await global.pool.getConnection()
      const [user] = await connection.query('SELECT id FROM users WHERE id = ?', [followingId])
      // check following user is exist
      if (!user || user.length === 0) {
        const err = new Error('使用者不存在!')
        err.status = 404
        throw err
      }
      // check the currnet user never follow
      const [followship] = await connection.query('SELECT * FROM followships WHERE followerId =? AND followingId=? ', [currentUserId, followingId])

      if (followship.length > 0) {
        const err = new Error('已經追蹤過此用戶!')
        err.status = 409
        throw err
      } else { // create followship
        await connection.query('INSERT INTO followships (followingId, followerId) VALUES (?, ?)', [followingId, currentUserId])
      }

      return res.status(201).json({ status: 'Success', message: '成功追蹤!' })
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  deleteFollowship: async (req, res, next) => {
    const { followingId } = req.params
    const currentUserId = req.user.id
    let connection
    try {
      // cannot follow self
      if (Number(followingId) === currentUserId) {
        const err = new Error('不可以追蹤及取消追蹤自己!')
        err.status = 409
        throw err
      }
      connection = await global.pool.getConnection()
      const [followship] = await connection.query('SELECT * FROM followships WHERE followingId = ? AND followerId = ?', [followingId, currentUserId])

      // check the currnet user has followed
      if (!followship || followship.length === 0) {
        const err = new Error('你沒有追蹤此用戶!')
        err.status = 404
        throw err
      } else {
        // delete the followship
        const [result] = await connection.query('DELETE FROM followships WHERE followingId = ? AND followerId = ?', [followingId, currentUserId])
        // 若刪除筆數為0則回傳錯誤訊息
        if (!result || result.length === 0) {
          const err = new Error('無法刪除此筆資料！')
          err.status = 404
          throw err
        } else {
          return res.status(200).json({ status: 'Success', message: '已取消追蹤!' })
        }
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  getFollowings: async (req, res, next) => {
    const { userId } = req.params
    let connection
    try {
      connection = await global.pool.getConnection()
      const [user] = await connection.query('SELECT id, nickname FROM users WHERE id =?', [userId])
      // check userId is exist
      if (!user || user.length === 0) {
        const err = new Error('使用者不存在!')
        err.status = 404
        throw err
      }
      // find following user list
      const [followings] = await connection.query('SELECT users.id, account, nickname, avatar FROM users JOIN followships ON followships.followerId = ? WHERE followingId = users.id', [userId])
      if (!followings || followings.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未追蹤其他人唷!' })
      } else {
        return res.status(200).json({ status: 'Success', data: followings })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  getFollowers: async (req, res, next) => {
    const { userId } = req.params
    let connection
    try {
      connection = await global.pool.getConnection()
      const [user] = await connection.query('SELECT id, nickname FROM users WHERE id =?', [userId])
      // check userId is exist
      if (!user || user.length === 0) {
        const err = new Error('使用者不存在!')
        err.status = 404
        throw err
      }
      // find followers list
      const [followers] = await connection.query('SELECT users.id, account, nickname, avatar FROM users JOIN followships ON followships.followingId = ? WHERE followerId = users.id', [userId])
      if (!followers || followers.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未被追蹤唷!' })
      } else {
        return res.status(200).json({ status: 'Success', data: followers })
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

module.exports = followshipController

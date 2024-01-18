const followshipController = {
  postFollowship: async (req, res, next) => {
    const { followingId } = req.params
    const currentUserId = req.user.id
    let connection
    try {
      // cannot follow self
      if (Number(followingId) === currentUserId) {
        const err = new Error('不可以追蹤自己!')
        err.status = 409
        throw err
      }

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
    const currentUser = req.user
    try {
      // check the currnet user has followed
      // delete the followship

    } catch (err) {
      next(err)
    }
  },
  getFollowings: async (req, res, next) => {
    const { userId } = req.params

    try {
    } catch (err) {
      next(err)
    }
  },
  getFollowers: async (req, res, next) => {
    const { userId } = req.params

    try {
    } catch (err) {
      next(err)
    }
  },
  sample: async (req, res, next) => {
    try {
    } catch (err) {
      next(err)
    }
  }
}

module.exports = followshipController

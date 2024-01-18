const activityController = {
  create: async (req, res, next) => {
    const {arenaId, shuttlecockId, date, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description} = req.body
    const userId = req.uesr.id
    let connection
    try {
      // 需要加入一些條件判斷避免重複創建
      connection = await global.pool.getConnection()
      const values = [userId, arenaId, shuttlecockId, date, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description]
      const valuesPlacholder =values.map(c=> '?').join(', ')
      // create activity
      await connection.query(`INSERT INTO activties (userId, arenaId, shuttlecockId, date, shuttlecockProvide, level, fee, numsOfPeople, totalPeople, description) VALUES(${valuesPlacholder})`,values)
      connection.release()

      return res.status(201).json({status:'Success', message: '成功建立活動!'})
    } catch (err) {
      next(err)
    }
  },
  edit: async (req, res, next) => {
    try {
    } catch (err) {
      next(err)
    }
  },
  delete: async (req, res, next) => {
    try {
    } catch (err) {
      next(err)
    }
  },
  getAll: async (req, res, next) => {
    try {
    } catch (err) {
      next(err)
    }
  },
  getActivity: async (req, res, next) => {
    try {
    } catch (err) {
      next(err)
    }
  },
  postParticipant: async (req, res, next) => {
    try {
    } catch (err) {
      next(err)
    }
  },
  deleteParticipant: async (req, res, next) => {
    try {
    } catch (err) {
      next(err)
    }
  }
}

module.exports = activityController
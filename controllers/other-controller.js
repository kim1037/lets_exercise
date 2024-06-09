const otherController = {
  getLevels: async (req, res, next) => {
    // #swagger.tags = ['Levels']
    let connection
    try {
      connection = await global.pool.getConnection()
      const [levels] = await connection.query('SELECT id, level FROM levels')
      if (!levels || levels.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未有任何程度的資訊' })
      } else {
        return res.status(200).json({ status: 'Success', data: levels })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  getRegions: async (req, res, next) => {
    // #swagger.tags = ['Regions']
    let connection
    try {
      connection = await global.pool.getConnection()
      const [regions] = await connection.query('SELECT * FROM regions')
      if (!regions || regions.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未有任何縣市的資訊' })
      } else {
        return res.status(200).json({ status: 'Success', data: regions })
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

module.exports = otherController

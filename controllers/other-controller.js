const otherController = {
  getLevels: async (req, res, next) => {
    // #swagger.tags = ['Levels']
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
  getRegions: async (req, res, next) => {
    // #swagger.tags = ['Regions']
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

module.exports = otherController

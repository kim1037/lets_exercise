const branchController = {
  getAll: async (req, res, next) => {
    let connection
    try {
      connection = await global.pool.getConnection()
      const [branches] = await connection.query('SELECT * FROM branches')
      if (!branch || branch.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未有任何品牌的資訊' })
      }else{
        return res.status(200).json({ status: 'Success', data: branches })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  getBranch: async (req, res, next) => {
    let connection
    const { branchId } = req.params
    try {
      connection = await global.pool.getConnection()
      const [branch] = await connection.query('SELECT * FROM branches WHERE id = ?', [branchId])
      if (!branch || branch.length === 0) {
        const err = new Error('找不到此品牌!')
        err.status = 404
        throw err
      }
      return res.status(200).json({ status: 'Success', data: branch[0] })
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }
}

module.exports = branchController
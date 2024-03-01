const shuttlecockController = {
  getAll: async (req, res, next) => {
    let connection
    try {
      connection = await global.pool.getConnection()
      const [shuttlecocks] = await connection.query('SELECT s.*, b.name FROM shuttlecocks AS s JOIN branches AS b ON b.id = s.branchId')
      if (!shuttlecocks || shuttlecocks.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未有任何羽球型號的資訊' })
      } else {
        return res.status(200).json({ status: 'Success', data: shuttlecocks })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  getShuttlecock: async (req, res, next) => {
    let connection
    const { shuttlecockId } = req.params
    try {
      connection = await global.pool.getConnection()
      const [shuttlecock] = await connection.query('SELECT s.*, b.name FROM shuttlecocks AS s JOIN branches AS b ON b.id = s.branchId WHERE s.id = ?', [shuttlecockId])
      if (!shuttlecock || shuttlecock.length === 0) {
        const err = new Error('找不到此羽球型號!')
        err.status = 404
        throw err
      }
      return res.status(200).json({ status: 'Success', data: shuttlecock[0] })
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }
}

module.exports = shuttlecockController
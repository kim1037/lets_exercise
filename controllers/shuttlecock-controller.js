const { getOffset, getPagination } = require('../utils/paginator-helper')
const shuttlecockController = {
  getAll: async (req, res, next) => {
    let connection
    const page = Number(req.query.page) || 1 // 初始預設頁
    const limit = Number(req.query.limit) || 10 // default 每頁10筆
    const offset = getOffset(limit, page)
    try {
      connection = await global.pool.getConnection()
      // find the total numbers of shuttlecocks
      const [amount] = await connection.query(`SELECT COUNT(*) AS total FROM shuttlecocks `)
      const totalAmount = amount[0].total
      if (offset > totalAmount) {
        const err = new Error(`資料頁碼超過範圍，此條件只有${Math.ceil(totalAmount / limit)}頁`)
        err.status = 404
        throw err
      }
      const [shuttlecocks] = await connection.query(`SELECT s.*, b.name FROM shuttlecocks AS s JOIN branches AS b ON b.id = s.branchId LIMIT ${limit} OFFSET ${offset}`)
      if (!shuttlecocks || shuttlecocks.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未有任何羽球型號的資訊' })
      } else {
        return res.status(200).json({ status: 'Success', pagination: getPagination(limit, page, totalAmount), data: shuttlecocks })
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
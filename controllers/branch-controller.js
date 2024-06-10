const { getOffset, getPagination } = require('../utils/paginator-helper')
const branchController = {
  getAll: async (req, res, next) => {
    // #swagger.tags = ['Branches']
    // #swagger.description = '取得所有品牌資訊'
    let connection
    const page = Number(req.query.page) || 1 // 初始預設頁
    const limit = Number(req.query.limit) || 10 // default 每頁10筆
    const offset = getOffset(limit, page)
    try {
      connection = await global.pool.getConnection()
      // find the total numbers of branches
      const [amount] = await connection.query('SELECT COUNT(*) AS total FROM branches ')
      const totalAmount = amount[0].total
      if (offset > totalAmount) {
        const err = new Error(`資料頁碼超過範圍，此條件只有${Math.ceil(totalAmount / limit)}頁`)
        err.status = 404
        throw err
      }
      const [branches] = await connection.query(`SELECT * FROM branches LIMIT ${limit} OFFSET ${offset}`)
      if (!branches || branches.length === 0) {
        return res.status(200).json({ status: 'Success', message: '目前尚未有任何品牌的資訊' })
      } else {
        return res.status(200).json({ status: 'Success', pagination: getPagination(limit, page, totalAmount), data: branches })
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
    // #swagger.tags = ['Branches']
    // #swagger.description = '取得特定一個品牌資訊'
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

const { getOffset, getPagination } = require('../utils/paginator-helper')
const arenaController = {
  getAll: async (req, res, next) => {
    // 篩選: 依縣市篩
    let connection
    const page = Number(req.query.page) || 1 // 初始預設頁
    const limit = Number(req.query.limit) || 10 // default 每頁10筆
    const region = req.query.region || ''
    const offset = getOffset(limit, page)
    try {
      connection = await global.pool.getConnection()
      // find the total numbers of arenas
      const [amount] = await connection.query(`SELECT COUNT(*) AS total FROM arenas ${region ? 'WHERE region = ?' : ''}`, (region ? [region] : []))
      const totalAmount = amount[0].total
      if (offset > totalAmount) {
        const err = new Error(`資料頁碼超過範圍，此條件只有${Math.ceil(totalAmount / limit)}頁`)
        err.status = 404
        throw err
      }
      // get arenas data
      const [arenas] = await connection.query(`SELECT * FROM arenas ${region ? 'WHERE region = ?' : ''} LIMIT ${limit} OFFSET ${offset}`, (region ? [region] : []))
      if (!arenas || arenas.length === 0) {
        return res.status(200).json({ status: 'Success', message: '此條件查無場地' })
      } else {
        return res.status(200).json({ status: 'Success', pagination: getPagination(limit, page, totalAmount), data: arenas })
      }
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  },
  getArena: async (req, res, next) => {
    let connection
    const { arenaId } = req.params
    try {
      connection = await global.pool.connection()
    } catch (err) {
      next(err)
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }

}

module.exports = arenaController

const { getOffset, getPagination } = require('../utils/paginator-helper')
const arenaController = {
  getAll: async (req, res, next) => {
    let connection
    const page = Number(req.query.page) || 1 // 初始預設頁
    const limit = Number(req.query.limit) || 10 // default 每頁10筆
    const regionId = req.query.regionId || '' // 篩選: 依縣市篩
    const offset = getOffset(limit, page)
    try {
      connection = await global.pool.getConnection()
      // find the total numbers of arenas
      const [amount] = await connection.query(`SELECT COUNT(*) AS total FROM arenas ${regionId ? 'WHERE regionId = ?' : ''}`, (regionId ? [regionId] : []))
      const totalAmount = amount[0].total
      if (offset > totalAmount) {
        const err = new Error(`資料頁碼超過範圍，此條件只有${Math.ceil(totalAmount / limit)}頁`)
        err.status = 404
        throw err
      }
      // get arenas data
      const [arenas] = await connection.query(`SELECT a.*, r.region FROM arenas AS a JOIN regions AS r ON a.regionId = r.id ${regionId ? 'WHERE a.regionId = ?' : ''} LIMIT ${limit} OFFSET ${offset}`, (regionId ? [regionId] : []))
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
      connection = await global.pool.getConnection()
      const [arena] = await connection.query('SELECT a.*, r.region FROM arenas AS a JOIN regions AS r ON a.regionId = r.id WHERE a.id = ?', [arenaId])
      if (!arena || arena.length === 0) {
        const err = new Error('找不到此場地!')
        err.status = 404
        throw err
      }

      return res.status(200).json({ status: 'Success', data: arena[0] })
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

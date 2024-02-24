const router = require('express').Router()
const arenaController = require('../../controllers/arena-controller')

router.get('/all', arenaController.getAll)
router.get('/:arenaId', arenaController.getArena)

module.exports = router

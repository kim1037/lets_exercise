const router = require('express').Router()
const otherController = require('../../controllers/other-controller')

router.get('/levels/all', otherController.getLevels) // get all levels
router.get('/regions/all', otherController.getRegions) // get all regions

module.exports = router

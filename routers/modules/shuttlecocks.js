const router = require('express').Router()
const shuttlecockController = require('../../controllers/shuttlecock-controller')

router.get('/all', shuttlecockController.getAll) // get all shuttlecocks
router.get('/:shuttlecockId', shuttlecockController.getShuttlecock) // get a shuttlecock

module.exports = router

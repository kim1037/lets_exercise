const router = require('express').Router()
const userController = require('../../controllers/user-controller')

router.put('/:userId')
router.get('/:userId', userController.getUserData) // 取得特定user Data

module.exports = router

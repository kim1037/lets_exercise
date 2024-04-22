const router = require('express').Router()
const userController = require('../../controllers/user-controller')
const { upload } = require('../../middleware/multer')

router.get('/participant/:userId', userController.getParticipants) // 取得某個使用者參加過的活動
router.get('/activities/:userId', userController.getActivities) // 取得某個使用者開過的活動
router.put('/:userId', upload.single('avatar'), userController.editUserProfile) // 編輯user data
router.get('/:userId', userController.getUserData) // 取得特定user Data

module.exports = router

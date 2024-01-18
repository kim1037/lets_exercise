const router = require('express').Router()
const activityController = require('../../controllers/activity-controller')

router.put('/edit/:activityId', activityController.edit) // 編輯一個活動
router.post('/participant/:activityId', activityController.postParticipant) // 參加一個活動
router.delete('/participant/:activityId', activityController.deleteParticipant) // 取消參加一個活動
router.get('/all', activityController.getAll) // 取得所有活動資料
router.post('/create', activityController.create) // 新增一個活動
router.get('/:activityId', activityController.getActivity) // 取得單一活動資料
router.delete('/:activityId', activityController.delete) // 刪除一個活動

module.exports = router
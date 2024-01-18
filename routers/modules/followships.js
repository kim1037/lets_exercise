const router = require('express').Router()
const followshipController = require('../../controllers/followship-controller')

router.post('/:followingId', followshipController.postFollowship) // 追蹤
router.delete('/:followingId', followshipController.deleteFollowship) // 取消追蹤
router.get('/:userId/following', followshipController.getFollowings) // 查看某位user目前追蹤的所有user
router.get('/:userId/followed', followshipController.getFollowers) // 查看目前追蹤某位user的所有user

module.exports = router

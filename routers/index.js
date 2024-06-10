const router = require('express').Router()
const users = require('./modules/users')
const followships = require('./modules/followships')
const activities = require('./modules/activities')
const arenas = require('./modules/arenas')
const branches = require('./modules/branches')
const others = require('./modules/others')
const auth = require('./modules/auth')
const shuttlecocks = require('./modules/shuttlecocks')
const userController = require('../controllers/user-controller')
const activityController = require('../controllers/activity-controller')
const passport = require('passport')
const { strictAuthenticated, easingAuthenticated } = require('../middleware/auth')

// 註冊、登入不必驗證token
router.post('/users/signup', userController.signup)
router.post('/users/signin', passport.authenticate('local', { session: false }), userController.signin)
router.use('/auth', auth)
router.use(others)

// 寬鬆驗證模式
router.get('/activities/all', easingAuthenticated, activityController.getAll) // 取得所有活動資料
router.get('/activities/:activityId', easingAuthenticated, activityController.getActivity) // 取得單一活動資料
router.use('/arenas', easingAuthenticated, arenas)
router.use('/branches', easingAuthenticated, branches)
router.use('/shuttlecocks', easingAuthenticated, shuttlecocks)
// 嚴格驗證模式
router.use('/users', strictAuthenticated, users)
router.use('/followships', strictAuthenticated, followships)
router.use('/activities', strictAuthenticated, activities)

// error handle
router.use('/', function (err, req, res, next) {
  const code = err.status || 500
  res.status(code).json({
    status: 'Error',
    statusCode: code,
    message: `${err.message}`
  })
})
module.exports = router

const router = require('express').Router()
const users = require('./modules/users')
const followships = require('./modules/followships')
const activities = require('./modules/activities')
const userController = require('../controllers/user-controller')
const passport = require('passport')
const { authenticated } = require('../middleware/auth')

// 註冊、登入不必驗證token
router.post('/users/signup', userController.signup)
router.post('/users/signin', passport.authenticate('local', { session: false }), userController.signin)
// 加入驗證
router.use('/users', authenticated, users)
router.use('/followships', authenticated, followships)
router.use('/activities', authenticated, activities)

// error handle
router.use('/', function (err, req, res, next) {
  const code = err.status || 500
  res.status(code).json({
    status: 'error',
    statusCode: code,
    error: `${err.message}`
  })
})
module.exports = router

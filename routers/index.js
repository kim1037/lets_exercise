const router = require('express').Router()
const users = require('./modules/users')
const userController = require('../controllers/user-controller')

// 註冊、登入不必驗證
router.post('/users/signup', userController.signup)
router.post('/users/signin')
// 加入驗證
router.use('/users', users)

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

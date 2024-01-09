const router = require('express').Router()
const users = require('./modules/users')

router.use('/api/users', users)

module.exports = router

const passport = require('passport')

module.exports = {
  strictAuthenticated: (req, res, next) => {
    // 嚴格模式 => 用於必須登入才能使用的api
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(401).json({ status: 'error', message: 'unauthorized' })
      }
      req.user = user
      next()
    })(req, res, next)
  },
  easingAuthenticated: (req, res, next) => {
    // 寬鬆模式 => 用於登不登入都可以使用的api
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (user) {
        req.user = user
      } else if (err) {
        console.err(err)
      }
      next()
    })(req, res, next)
  }
}

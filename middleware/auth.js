const passport = require('passport')

module.exports = {
  strictAuthenticated: (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(401).json({ status: 'error', message: 'unauthorized' })
      }
      req.user = user
      next()
    })(req, res, next)
  },
  easingAuthenticated: (req, res, next) => {
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

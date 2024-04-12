const router = require('express').Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')

router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'user_birthday', 'user_gender'] }))

router.get('/facebook/callback',
  (req, res, next) => {
    passport.authenticate('facebook', async (err, user, info) => {
      if (err) {
        next(err)
      }
      if (!user) {
        // 登入失敗
        return res.status(401).json({ error: 'Authenticate Failed' })
      }
      // 登入成功
      const token = jwt.sign(user, global.config.JWT_SECRET, { expiresIn: '30d' })
      return res.status(200).json({
        status: 'Success',
        data: { token, user }
      })
    })(req, res, next)
  })

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['email', 'profile']
  })
)

router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/users/login'
  })
)

router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email']
  })
)

router.get(
  '/github/callback',
  passport.authenticate('github', {
    successRedirect: '/',
    failureRedirect: '/users/login'
  })
)

module.exports = router

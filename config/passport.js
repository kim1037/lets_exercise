const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const FacebookStrategy = require('passport-facebook').Strategy
const JwtStrategy = passportJWT.Strategy
const ExtractJwt = passportJWT.ExtractJwt
const bcrypt = require('bcryptjs')
const dataHelpers = require('../utils/data-helpers')

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 在req的何處尋找token
  secretOrKey: global.config.JWT_SECRET // 自訂密鑰
}

// set local strategy => to verify user account and password
passport.use(new LocalStrategy({
  usernameField: 'account',
  passwordField: 'password'
}, async (account, password, done) => {
  try {
    const connection = await global.pool.getConnection()
    // it can use account or email for login
    let mainColumn = 'account'
    if (account.includes('@') && account.includes('.')) {
      mainColumn = 'email'
    }
    // search users table
    const [user] = await connection.query(`SELECT id, account, email, nickName, password, avatar, introduction FROM users WHERE ${mainColumn} = ?`, [account])
    connection.release()

    // check user exist
    if (!user || user.length === 0) {
      const error = new Error('帳號不存在！')
      error.status = 401
      return done(error, false)
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user[0].password)
    if (!isMatch) {
      const error = new Error('帳號或是密碼錯誤！')
      error.status = 401
      return done(error, false)
    } else {
      // authenticated, return user
      delete user[0].password
      return done(null, user[0])
    }
  } catch (err) {
    return done(err, false)
  }
}))

// set jwt strategy => to get user info
passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
  try {
    const connection = await global.pool.getConnection()
    // use user id to search
    const [user] = await connection.query('SELECT id, account, nickName, avatar, introduction FROM users WHERE id = ?', [jwtPayload.id])
    connection.release()

    if (!user || user.length === 0) {
      return done(null, false)
    }
    return done(null, user[0])
  } catch (err) {
    return done(err)
  }
}))

// facebook oauth 2.0
passport.use(new FacebookStrategy({
  clientID: global.config.FACEBOOK_APP_ID,
  clientSecret: global.config.FACEBOOK_APP_SECRET,
  callbackURL: 'http://localhost:3000/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'email', 'birthday', 'first_name', 'gender', 'last_name']
  // about => introduction;
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // console.log('Test Facebook data:', profile) // 先確認欄位屬性
    /* eslint-disable camelcase */
    const { email, gender, birthday, first_name, last_name } = profile._json
    const connection = await global.pool.getConnection()
    const [user] = await connection.query('SELECT id, account, nickName, avatar, introduction FROM users WHERE email = ?', [email])
    if (!user || user.length === 0) {
      // 首次登入用facebook資料註冊, 必填欄位使用假資料
      const password = dataHelpers.generatePassword()
      const hashedPassword = bcrypt.hashSync(password) // 密碼加密
      const birthdate = new Date(birthday)
      await global.pool.query('INSERT INTO users (email, password, firstName, lastName, gender, birthdate) VALUES (?,?,?,?,?,?)', [email, hashedPassword, first_name, last_name, gender, birthdate])
    } else {
      // 已登入過則直接回傳user data
      return done(null, user[0])
    }
  } catch (err) {
    return done(err)
  }
}
))

module.exports = passport

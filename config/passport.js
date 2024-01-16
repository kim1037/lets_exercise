const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const JwtStrategy = passportJWT.Strategy
const ExtractJwt = passportJWT.ExtractJwt
const bcrypt = require('bcryptjs')
// const dbConfig = global.config.mysql
// const mysql = require('mysql2/promise')

// const pool = mysql.createPool({
//   connectionLimit: 10,
//   host: dbConfig.host,
//   user: dbConfig.user,
//   password: dbConfig.password,
//   database: dbConfig.database
// })

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
    const [user] = await connection.query(`SELECT account, email, nickName, password, avatar, introduction FROM users WHERE ${mainColumn} = ?`, [account])
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
    const [user] = await connection.query('SELECT account, nickName, avatar, introduction FROM users WHERE id = ?', [jwtPayload.id])
    connection.release()

    if (!user || user.length === 0) {
      return done(null, false)
    }
    return done(null, user[0])
  } catch (err) {
    return done(err)
  }
}))

module.exports = passport

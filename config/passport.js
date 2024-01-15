const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const JwtStrategy = passportJWT.Strategy
const ExtractJwt = passportJWT.ExtractJwt
const bcrypt = require('bcryptjs')
const config = require('./config.json').mysql
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  connectionLimit: 10,
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database
})

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

// set local strategy => to verify user account and password
passport.use(new LocalStrategy({
  usernameField: 'account',
  passwordField: 'password'
}, async(account, password, done)=> {
  try{
    const connection = await pool.getConnection()
    // check user exist
    const [user] = await connection.query('SELECT * FROM users WHERE account = ?', [account])
    connection.release();
    if(!user || user.length === 0){
      const error = new Error('帳號不存在！');
      error.status = 401;
      return done(error, false);
    }
    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('帳號或是密碼錯誤！');
      error.status = 401;
      return done(error, false);
    }else{
      // authenticated, return user
      return done(null, user[0]);
    }

  } catch(err){
    return done(err, false)
  }
}))

// set jwt strategy => to get user info
passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
  try{
    const connection = await pool.getConnection();
    // use user id to search
    const [user] = await connection.query('SELECT * FROM users WHERE id = ?', [jwtPayload.id])
    connection.release();

    if(!user || user.length === 0){
      return done(null, false)
    }
    return done(null, user[0]);
  }catch(err){
    return done(err)
  }
}))

module.exports = passport
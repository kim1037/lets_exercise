const express = require('express')
const app = express()
global.config = require('./config/config')
const PORT = global.config.PORT || 3000
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')

// connent database
const mysql = require('mysql2/promise')
global.pool = mysql.createPool({
  connectionLimit: 10,
  host: global.config.mysql.host,
  user: global.config.mysql.user,
  password: global.config.mysql.password,
  database: global.config.mysql.database
})
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// cors
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}))

// set passport
app.use(require('./config/passport').initialize())

// default
app.get('/', (req, res) => {
  // #swagger.ignore = true
  res.send('hi wolrd')
})

// routes
app.use(require('./routers'))

// swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(PORT, () => {
  console.log(`Server is listening on http://127.0.0.1:${PORT}`)
})

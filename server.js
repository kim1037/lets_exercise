const express = require('express')
const app = express()
global.config = require('./config/config')
const PORT = global.config.PORT || 3000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// set passport
app.use(require('./config/passport').initialize())

app.get('/', (req, res) => {
  res.send('hi wolrd')
})

// routes
app.use(require('./routers'))

app.listen(PORT, () => {
  console.log(`Server is listening on http://127.0.0.1:${PORT}`)
})

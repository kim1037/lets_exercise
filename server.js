const express = require('express')
const routes = require('./routers')
const app = express()
const PORT = 3000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('hi wolrd')
})

// routes
app.use(routes)

app.listen(PORT, () => {
  console.log(`Server is listening on http://127.0.0.1:${PORT}`)
})

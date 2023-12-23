const express = require('express')
const app = express()
const port = 3000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('hi wolrd')
})

app.listen(port, () => {
  console.log(`Server is listening on http://127.0.0.1:${port}`)
})

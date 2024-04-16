const swaggerAutogen = require('swagger-autogen')()

const doc = {
  info: {
    version: '1.0.0',
    title: 'Lets Exercise API',
    description: 'Description'
  },
  host: 'localhost:3000',
  tags: [ // by default: empty Array
    {
      name: 'Users', // Tag name
      description: '' // Tag description
    },
    {
      name: 'Activities', // Tag name
      description: '' // Tag description
    },
    {
      name: 'Branches', // Tag name
      description: '' // Tag description
    }
  ]

}

const outputFile = './swagger.json'
const routes = ['./server.js']

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc)

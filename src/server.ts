import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'

import config from './config'
import { DefaultRoutes, StreamRoutes } from './routes'

const app = express()

// tslint:disable-next-line: deprecation
app.use(bodyParser.json())
app.use(cors())
app.use('/static', express.static('public'))

const start = async () => {
  // Register all the routes here
  DefaultRoutes.register(app)
  StreamRoutes.register(app)

  app.listen(config.port, () => {
    console.debug(`Listening on port: http://localhost:${config.port}`)
  })
}

// tslint:disable-next-line
start()

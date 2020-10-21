import * as fs from 'fs'
import * as express from 'express'
import * as iotsReporters from 'io-ts-reporters'

import * as T from '../lib/types'
import config from '../config'

import { convertStream } from '../lib/ffmpeg'
import { authenticationMiddleware } from './authorization'

export const StreamRoutes = {
  register: (app: express.Application) => {
    app.post('/stream/convert', authenticationMiddleware, (req, res) => {
      const data = T.parseData<T.StreamConvertRequestType>(req.body, T.StreamConvertRequest)

      if (T.isParseError(data)) {
        return res.status(400).json({
          errors: iotsReporters.default.report(data)
        })
      }

      let sourceUrl = data.url
      if (data.url.includes('?')) {
        sourceUrl = data.url.split('?')[0]
      }

      const streamId = T.getStreamId(sourceUrl)
      const outputPath = `./public/${streamId}`

      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath)
      }
      convertStream(data.url, outputPath)

      return res.json({ url: `${config.url}/static/${streamId}/stream.m3u8` })
    })
  }
}

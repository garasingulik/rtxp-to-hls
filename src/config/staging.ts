import { Config } from './index'

const config: Config = {
  port: 80,
  secret: process.env.API_SECRET || '',
  url: process.env.STREAM_API_URL || '',
  ffmpeg: '/usr/bin/ffmpeg',
  uniqueStream: process.env.UNIQUE_STREAM === 'true'
}

export default config

import { Config } from './index'

const config: Config = {
  port: 3005,
  secret: process.env.API_SECRET || '',
  url: process.env.STREAM_API_URL || '',
  ffmpeg:  process.env.FFMPEG_PATH || '/usr/bin/ffmpeg'
}

export default config

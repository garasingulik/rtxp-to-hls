import { Config } from './index'

const config: Config = {
  port: 80,
  secret: process.env.API_SECRET || ''
}

export default config

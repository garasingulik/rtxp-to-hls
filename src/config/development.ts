import { Config } from './index'

const config: Config = {
  port: 3000,
  secret: process.env.API_SECRET || ''
}

export default config

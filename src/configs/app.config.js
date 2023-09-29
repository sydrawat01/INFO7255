import 'dotenv/config'

const { HOSTNAME, PORT, REDIS_PORT } = process.env

const appConfig = {
  HOSTNAME,
  PORT,
  REDIS_PORT,
}

export default appConfig

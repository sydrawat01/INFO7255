import 'dotenv/config'

const { HOSTNAME, PORT, REDIS_PORT, CLIENT_ID } = process.env

const appConfig = {
  HOSTNAME,
  PORT,
  REDIS_PORT,
  CLIENT_ID,
}

export default appConfig

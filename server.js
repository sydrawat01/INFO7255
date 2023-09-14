import 'dotenv/config'
import app from './src/api/app'
import appConfig from './src/configs/app.config'
import logger from './src/configs/logger.config'

const { HOSTNAME, PORT } = appConfig

app.listen(PORT, () => {
  logger.info(`Server running @ http://${HOSTNAME}:${PORT}`)
})


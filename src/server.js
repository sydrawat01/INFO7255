import 'dotenv/config'
import app from './api/app'
import appConfig from './configs/app.config'
import logger from './configs/logger.config'

const { HOSTNAME, PORT } = appConfig

app.listen(PORT, () => {
  logger.info(`Server running @ http://${HOSTNAME}:${PORT}`, { HOSTNAME, PORT })
})

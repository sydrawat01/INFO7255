import 'dotenv/config'
import express from 'express'
import appConfig from './src/configs/app.config'
import logger from './src/configs/logger.config'
import { healthRoute } from './src/routes/index.routes'

const app = express()
const { HOSTNAME, PORT } = appConfig

app.use(express.json())
app.set("etag", "strong")

app.use ('/', healthRoute)

app.listen(PORT, () => {
  logger.info(`Server running @ http://${HOSTNAME}:${PORT}`)
})

export default app

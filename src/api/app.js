import express from 'express'
import { errorHandler } from './middlewares/errorHandler'
import { healthRoute, planRoute } from './routes/index.routes'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/', healthRoute)
app.use('/v1/', planRoute)
app.use(errorHandler)

export default app

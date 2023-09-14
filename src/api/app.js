import express from 'express'
import { healthRoute } from './routes/health.route'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/', healthRoute)

export default app

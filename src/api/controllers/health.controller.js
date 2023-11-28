import logger from '../../configs/logger.config'

const health = (req, res) => {
  const { protocol, method, hostname, originalUrl } = req
  const headers = { ...req.headers }
  const metaData = { protocol, method, hostname, originalUrl, headers }
  logger.info(
    `Requesting ${method} ${protocol}://${hostname}${originalUrl}`,
    metaData
  )
  const data = {
    message: 'OK',
    date: new Date(),
    uptime: process.uptime(),
  }
  res.status(200).json(data)
}

export { health }

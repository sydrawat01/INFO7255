import logger from '../../configs/logger.config'

export const errorHandler = (err, req, res, next) => {
  const errStatus = err.statusCode || 500
  const errMessage = err.message || 'Something went wrong'
  res.status(errStatus).json({
    error: err.name,
    message: errMessage,
    data: err.data,
    // stack: err.stack,
  })
  logger.error(errMessage, meta)
}

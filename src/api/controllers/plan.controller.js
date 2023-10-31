import { findPlan, addPlan, deleteByPlanId } from '../services/redis.client'
import { validate, md5hash } from '../utils/schemaValidation'
import {
  BadRequestError,
  InternalServerError,
  ResourceNotFoundError,
  PreConditionFailedError,
  conflictHandler,
  createHandler,
  noContentHandler,
  notModifiedHandler,
  successHandler,
} from '../utils/error.util'
import logger from '../../configs/logger.config'

const getPlan = async (req, res, next) => {
  const { protocol, method, hostname, originalUrl, params } = req
  const headers = { ...req.headers }
  const metaData = { protocol, method, hostname, originalUrl, headers, params }
  logger.info(
    `Requesting ${method} ${protocol}://${hostname}${originalUrl}`,
    metaData
  )
  try {
    const { planId } = params
    if (planId === null || planId === '' || planId === '{}') {
      throw new BadRequestError(`Invalid planId`)
    }
    const value = await findPlan(planId)
    if (value.objectId === planId) {
      // conditional read based on `if-none-match` header
      if (
        req.headers['if-none-match'] &&
        value.ETag === req.headers['if-none-match']
      ) {
        res.setHeader('ETag', value.ETag)
        const data = {
          message: 'Plan has not changed',
          plan: JSON.parse(value.plan),
        }
        notModifiedHandler(res, data)
      } else {
        res.setHeader('ETag', value.ETag)
        const data = {
          message: 'Plan has changed',
          plan: JSON.parse(value.plan),
        }
        successHandler(res, data)
      }
    } else {
      throw new ResourceNotFoundError(`Plan not found`)
    }
  } catch (err) {
    next(err)
  }
}

const savePlan = async (req, res, next) => {
  const { protocol, method, hostname, originalUrl, params } = req
  const headers = { ...req.headers }
  const metaData = { protocol, method, hostname, originalUrl, headers, params }
  logger.info(
    `Requesting ${method} ${protocol}://${hostname}${originalUrl}`,
    metaData
  )
  try {
    if (validate(req.body)) {
      const value = await findPlan(req.body.objectId)
      if (value) {
        res.setHeader('ETag', value.ETag)
        const data = { message: 'Item already exists' }
        conflictHandler(res, data)
      } else {
        const newPlan = await addPlan(req.body)
        const { ETag } = newPlan
        res.setHeader('ETag', ETag)
        const data = {
          message: 'Item added',
          ETag,
        }
        createHandler(res, data)
      }
    } else {
      throw new BadRequestError(`Item is not valid`)
    }
  } catch (err) {
    next(err)
  }
}

const deletePlan = async (req, res, next) => {
  const { protocol, method, hostname, originalUrl, params } = req
  const headers = { ...req.headers }
  const metaData = { protocol, method, hostname, originalUrl, headers, params }
  logger.info(
    `Requesting ${method} ${protocol}://${hostname}${originalUrl}`,
    metaData
  )
  try {
    const { planId } = params
    if (planId === null || planId === '' || planId === '{}') {
      throw new BadRequestError(`Invalid planId`)
    }
    const value = await findPlan(planId)
    if (value !== false && value.objectId === planId) {
      // conditional delete based on `if-match` header
      const data = {
        plan: JSON.parse(value.plan),
      }
      if (req.headers['if-match']) {
        // if ETag matches on conditional delete
        if (value.ETag === req.headers['if-match']) {
          logger.info(`Item found`, JSON.parse(value.plan))
          if (deleteByPlanId(planId)) {
            logger.info(`Item deleted`, JSON.parse(value.plan))
            noContentHandler(res, data)
          } else {
            throw new InternalServerError(`Item not deleted`)
          }
        } else {
          throw new PreConditionFailedError(
            `ETag provided in header is not valid`
          )
        }
      } else if (deleteByPlanId(planId)) {
        logger.info(`Item deleted`, JSON.parse(value.plan))
        noContentHandler(res, data)
      } else {
        throw new InternalServerError(`Item not deleted`)
      }
    } else {
      throw new ResourceNotFoundError(`Plan not found`)
    }
  } catch (err) {
    next(err)
  }
}

const editPlan = async (req, res, next) => {
  const { protocol, method, hostname, originalUrl, params } = req
  const headers = { ...req.headers }
  const metaData = { protocol, method, hostname, originalUrl, headers, params }
  logger.info(
    `Requesting ${method} ${protocol}://${hostname}${originalUrl}`,
    metaData
  )
  try {
    // TODO: implement PATCH logic
  } catch (err) {
    next(err)
  }
}

export { getPlan, savePlan, deletePlan, editPlan }

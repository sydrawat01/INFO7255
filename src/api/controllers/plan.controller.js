import { findPlan, addPlan, delPlan } from '../services/redis.client'
import { validate, md5hash } from '../utils/schemaValidation'
import {
  BadRequestError,
  ResourceNotFoundError,
  conflictHandler,
  createHandler,
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
  const planId = params.planId
  try {
    if (planId === null || planId === '' || planId === '{}') {
      throw new BadRequestError(`Invalid planId`)
    }
    const value = await findPlan(planId)
    if (value.objectId === planId) {
      if (
        req.headers['if-none-match'] &&
        value.ETag == req.headers['if-none-match']
      ) {
        res.setHeader('ETag', value.ETag)
        const data = {
          message: 'Plan has not changed',
          plan: JSON.parse(value.plan),
        }
        notModifiedHandler(res, data)
        return
      } else {
        res.setHeader('ETag', value.ETag)
        const data = {
          message: 'Plan has changed',
          plan: JSON.parse(value.plan),
        }
        successHandler(res, data)
        return
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
        return
      } else {
        const ETag = (await addPlan(req.body)).ETag
        res.setHeader('ETag', ETag)
        const data = {
          message: 'Item added',
          ETag,
        }
        createHandler(res, data)
        return
      }
    } else {
      throw new BadRequestError(`Item is not valid`)
    }
  } catch (err) {
    next(err)
  }
}

const deletePlan = async (req, res, next) => {}

export { getPlan, savePlan, deletePlan }

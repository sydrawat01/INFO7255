import {
  createETag,
  checkIfPlanExists,
  getPlanETag,
  getPlanService,
  savePlanService,
  deletePlanService,
  patchObject,
  patchList,
} from '../services/redis.client'
import { validateSchema } from '../utils/schemaValidation'
import {
  BadRequestError,
  InternalServerError,
  ResourceNotFoundError,
  conflictHandler,
  createHandler,
  noContentHandler,
  notModifiedHandler,
  successHandler,
  preconditionCheckHandler,
  preconditionRequiredHandler,
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
    const doesPlanExist = await checkIfPlanExists(planId)
    if (!doesPlanExist) {
      throw new ResourceNotFoundError(`Plan not found`)
    }
    const [plan, etag] = await getPlanService(planId)
    if (!plan) {
      throw new ResourceNotFoundError(`Plan not found`)
    }
    if (
      req.headers['if-none-match'] !== undefined &&
      req.headers['if-none-match'] === etag
    ) {
      const data = {
        message: 'Plan has not changed',
        plan: JSON.parse(plan),
      }
      notModifiedHandler(res, data, etag)
      return
    }
    const data = {
      message: 'Plan has changed',
      plan: JSON.parse(plan),
    }
    successHandler(res, data, etag)
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
    const plan = JSON.stringify(req.body)
    if (req.body === '{}' || plan === '{}') {
      throw new BadRequestError(`Invalid plan JSON payload body`)
    }
    const valid = validateSchema(req.body)
    if (!valid) {
      throw new BadRequestError(`Could not verify JSON payload body`)
    }
    const { objectId } = req.body
    const doesPlanExist = await checkIfPlanExists(objectId)
    if (doesPlanExist) {
      const data = { message: `Plan with ID ${objectId} already exists` }
      conflictHandler(res, data)
      return
    }
    const etag = createETag(objectId)
    const resObjectId = await savePlanService(objectId, plan, etag)
    if (!resObjectId !== null) {
      const data = {
        message: `Plan with ID ${objectId} added successfully`,
        ETag: etag,
      }
      createHandler(res, data, etag)
    } else {
      throw new InternalServerError(`InternalServerError`, { error: res })
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
    const doesPlanExist = await checkIfPlanExists(planId)
    if (!doesPlanExist) {
      throw new ResourceNotFoundError(`Plan not found`)
    }
    const etag = await getPlanETag(planId)
    let isDeleted = false
    if (req.headers['if-match'] === undefined) {
      const data = {
        message: `Precondition required. Try using "If-Match"`,
      }
      preconditionRequiredHandler(res, data)
      return
    }
    if (req.headers['if-match'] !== etag) {
      const data = {
        message: `A requested precondition check failed`,
      }
      preconditionCheckHandler(res, data)
      return
    }
    if (req.headers['if-match'] === etag) {
      isDeleted = await deletePlanService(planId)
    }
    if (!isDeleted) {
      throw new InternalServerError(`InternalServerError`, { error: res })
    }
    const data = {
      message: `Plan with ID ${planId} successfully deleted`,
    }
    noContentHandler(res, data, etag)
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
    const { planId } = params
    const doesPlanExist = await checkIfPlanExists(planId)
    if (!doesPlanExist) {
      throw new ResourceNotFoundError(`Plan not found`)
    }
    let [plan, etag] = await getPlanService(planId)
    if (req.headers['if-match'] === undefined) {
      const data = {
        message: `Precondition required. Try using "If-Match"`,
      }
      preconditionRequiredHandler(res, data)
      return
    }
    if (req.headers['if-match'] !== etag) {
      const data = {
        message: `A requested precondition check failed`,
      }
      preconditionCheckHandler(res, data)
      return
    }
    if (req.headers['if-match'] === etag) {
      plan = JSON.parse(plan)
      for (const key in req.body) {
        if (typeof req.body[key] !== 'string') {
          if (req.body[key] instanceof Array) {
            plan = patchList(plan, req.body[key], key)
            if (plan === 'BadRequest') {
              throw new BadRequestError(`List objects must contain object ID`, {
                error: res,
              })
            }
          } else {
            plan = patchObject(plan, req.body[key], key)
          }
        } else {
          plan[key] = req.body[key]
        }
      }
    }
    const valid = validateSchema(plan)
    if (!valid) {
      throw new BadRequestError(`Could not verify JSON payload body`)
    }
    const { objectId } = plan
    const doesNewPlanExist = await checkIfPlanExists(objectId)
    if (objectId !== planId && doesNewPlanExist) {
      const data = { message: `Plan with ID ${objectId} already exists` }
      conflictHandler(res, data)
      return
    }
    plan = JSON.stringify(plan)
    etag = createETag(plan)
    if (planId !== objectId) {
      await deletePlanService(planId)
    }
    const resObjectId = await savePlanService(objectId, plan, etag)
    if (resObjectId !== null) {
      successHandler(res, JSON.parse(plan), etag)
    } else {
      throw new InternalServerError(`InternalServerError`, { error: res })
    }
  } catch (err) {
    next(err)
  }
}

export { getPlan, savePlan, deletePlan, editPlan }

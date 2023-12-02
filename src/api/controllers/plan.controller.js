import { producer } from '../services/rabbitmq.service'
import { ifKeyExists, getETag } from '../services/redis.service'
import { isValidJSONSchema } from '../services/schema.service'
import appConfig from '../../configs/app.config'
import logger from '../../configs/logger.config'
import { PLAN_SCHEMA } from '../models/plan.model'
import {
  createSavePlan,
  getSavedPlan,
  deleteSavedPlan,
  generateETag,
} from '../services/plan.service'
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

const getPlan = async (req, res, next) => {
  const { protocol, method, hostname, originalUrl, params } = req
  const headers = { ...req.headers }
  const metaData = { protocol, method, hostname, originalUrl, headers, params }
  logger.info(
    `Requesting ${method} ${protocol}://${hostname}${originalUrl}`,
    metaData
  )
  try {
    const { objectId } = params
    if (objectId === null || objectId === '' || objectId === '{}') {
      throw new BadRequestError(`Invalid objectId`)
    }

    // Key format: <type>_<objectId>
    const KEY = `${appConfig.PLAN_TYPE}_${objectId}`

    // Check if KEY is present in the Redis datastore
    const isKeyValid = await ifKeyExists(KEY)
    logger.info(`Key found:`, { KEY })

    // Check for valid objectId
    if (!isKeyValid) {
      logger.error(`Key ${KEY} is not valid`, { KEY })
      throw new ResourceNotFoundError(`Plan not found`)
    }

    const etag = await getETag(KEY)

    const urlETag = req.headers['If-None-Match']
    if (!!urlETag && urlETag.equals(etag)) {
      logger.info(`ETAG present`, { etag })
      const data = {
        message: 'Plan has not changed',
      }
      notModifiedHandler(res, data, etag)
      return
    }

    // Save data to Redis datastore
    logger.info(`Getting latest plan from Redis datastore`, { KEY })
    const plan = await getSavedPlan(KEY)
    logger.info(`Latest plan from Redis`, { KEY, plan })
    const data = {
      plan,
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
    const planJSON = req.body
    if (!!!planJSON) {
      logger.error(`Invalid plan payload body`)
      throw new BadRequestError(`Invalid plan payload body`)
    }
    logger.info(`Validating JSON payload data`, { payload: planJSON })
    const isValidSchema = await isValidJSONSchema(planJSON, PLAN_SCHEMA)
    if (isValidSchema?.error) {
      logger.error(`Invalid JSON for payload body`, {
        error: 'INVALID_SCHEMA',
        ...isValidSchema?.data,
      })
      throw new BadRequestError(`Could not verify JSON payload body`)
    }

    // Valid JSON payload body
    logger.info(`Valid JSON payload body`, { payload: planJSON })

    // Key format: <type>_<objectId>
    const KEY = `${appConfig.PLAN_TYPE}_${planJSON.objectId}`

    logger.info(`Checking for KEY validation`, { KEY })
    const isKeyValid = await ifKeyExists(KEY)
    if (isKeyValid) {
      const data = {
        message: `Plan with ID ${planJSON.objectId} already exists`,
      }
      conflictHandler(res, data)
      return
    }
    // Create and save the plan to Redis datastore
    await createSavePlan(KEY, planJSON)
    const etag = generateETag(KEY, planJSON)
    // Send the message to queue for indexing
    logger.info(`Sending message to RabbitMQ queue`)
    const message = {
      operation: 'STORE',
      body: planJSON,
    }
    producer(message)
    logger.info(`Plan added successfully`, { objectId: planJSON.objectId })
    const data = {
      message: `Plan with ID ${planJSON.objectId} added successfully`,
    }
    createHandler(res, data, etag)
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
    const { objectId } = params

    // Key format: <type>_<objectId>
    const KEY = `${appConfig.PLAN_TYPE}_${objectId}`

    logger.info(`Checking for KEY validation`, { KEY })
    const isKeyValid = await ifKeyExists(KEY)

    if (!isKeyValid) {
      logger.error(`Key ${KEY} is not valid`, { KEY })
      throw new ResourceNotFoundError(`Plan not found`)
    }

    // Delete the plan
    const etag = await getETag(KEY)
    if (
      req.headers['if-match'] === undefined ||
      req.headers['if-match'] === '[]'
    ) {
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
      const oldPlan = await getSavedPlan(KEY)
      logger.info(`Sending message to RabbitMQ queue`)
      const message = {
        operation: 'DELETE',
        body: oldPlan,
      }
      producer(message)

      logger.info(`Deleting plan`, { KEY })
      await deleteSavedPlan(KEY)
      const data = {
        message: `Plan with ID ${objectId} successfully deleted`,
      }
      noContentHandler(res, data, etag)
    } else {
      throw new InternalServerError(
        `InternalServerError deleting plan ${KEY}`,
        { error: res }
      )
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
    const { objectId } = params
    const planJSON = req.body

    // Key format: <type>_<objectId>
    const KEY = `${appConfig.PLAN_TYPE}_${objectId}`

    logger.info(`Checking for KEY validation`, { KEY })
    const isKeyValid = await ifKeyExists(KEY)

    if (!isKeyValid) {
      logger.error(`Key ${KEY} is not valid`, { KEY })
      throw new ResourceNotFoundError(`Plan not found`)
    }

    // Invalid JSON payload data
    if (!planJSON) {
      logger.error(`Invalid plan payload body`)
      throw new BadRequestError(`Invalid plan payload body`)
    }
    logger.info(`Validating JSON payload data`, { payload: planJSON })
    const isValidSchema = await isValidJSONSchema(planJSON, PLAN_SCHEMA)
    if (isValidSchema?.error) {
      logger.error(`Invalid JSON for payload body`, {
        error: 'INVALID_SCHEMA',
        ...isValidSchema?.data,
      })
      throw new BadRequestError(`Could not verify JSON payload body`)
    }

    const etag = await getETag(KEY)

    if (
      req.headers['if-match'] === undefined ||
      req.headers['if-match'] === '[]'
    ) {
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
      // Create new ETAG and save data to Redis datastore
      logger.info(`etag match successful`, { oldETag: etag })
      const newETag = generateETag(KEY, planJSON)
      logger.info(`Created new ETAG`, { newETag })

      // TODO: Fix patch
      await createSavePlan(KEY, planJSON)

      logger.info(`Plan saved/updated successfully`, {
        etag: newETag,
        plan: planJSON,
      })

      // Send message to RabbitMQ queue for indexing
      const plan = await getSavedPlan(KEY)
      const message = {
        operation: 'STORE',
        body: plan,
      }
      producer(message)

      logger.info(`Patched plan from Redis`, { KEY, plan })
      const data = {
        plan,
      }
      successHandler(res, data, newETag)
    } else {
      throw new InternalServerError(
        `InternalServerError patching plan ${KEY}`,
        { error: res }
      )
    }
  } catch (err) {
    logger.error(`Error`, { err })
    next(err)
  }
}

export { getPlan, savePlan, deletePlan, editPlan }

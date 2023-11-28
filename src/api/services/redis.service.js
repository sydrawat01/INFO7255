import 'dotenv/config'
import { createClient } from 'redis'
import crypto from 'crypto'
import appConfig from '../../configs/app.config'
import logger from '../../configs/logger.config'

const { REDIS_HOST, REDIS_PORT } = appConfig

const client = createClient(REDIS_PORT, REDIS_HOST)

client.on('connect', () => {
  logger.info('Connected to redis', { REDIS_HOST, REDIS_PORT })
})
client.on('error', (error) => {
  logger.error(`redis client error`, { error })
})

// Connect to the Redis datastore client
client.connect()

const createETag = (plan) => {
  try {
    const hash = crypto.createHash('sha256').update(plan).digest('base64')
    return hash
  } catch (err) {
    logger.error(`Error creating the hash`, { error: err })
  }
}

const checkIfPlanExists = async (objectId) => {
  try {
    const exists = await client.exists(objectId)
    if (!exists) return false
    return true
  } catch (err) {
    logger.error(`Redis Client Error`, { error: err })
  }
}

const getPlanETag = async (objectId) => {
  try {
    const exists = await checkIfPlanExists(`${objectId}_etag`)
    if (!exists) return false
    const etag = await client.get(`${objectId}_etag`)
    return etag
  } catch (err) {
    logger.error(`Redis Client error`, { error: err })
  }
}

const getPlanService = async (objectId) => {
  try {
    const exists = await checkIfPlanExists(objectId)
    if (!exists) return false
    const plan = await client.get(objectId)
    const etag = await client.get(`${objectId}_etag`)
    return [plan, etag]
  } catch (err) {
    logger.error(`Redis Client error`, { error: err })
  }
}

const deletePlanService = async (objectId) => {
  try {
    const exists = await checkIfPlanExists(objectId)
    if (!exists) return false
    const deleted = await client.del(objectId)
    const deletedETag = await client.del(`${objectId}_etag`)
    return deleted && deletedETag
  } catch (err) {
    logger.error(`Redis Client error`, { error: err })
  }
}

const savePlanService = async (objectId, plan, etag) => {
  try {
    await client.set(objectId, plan)
    await client.set(`${objectId}_etag`, etag)
    return objectId
  } catch (err) {
    logger.error(`Redis Client error`, { error: err })
  }
}

const patchObject = (mainObject, reqBody, k) => {
  try {
    for (const key in reqBody) {
      mainObject[k][key] = reqBody[key]
    }
    return mainObject
  } catch (err) {
    logger.error(`Redis Client error`, { error: err })
  }
}

const patchList = (mainObject, reqBody, k) => {
  try {
    const hMap = new Map()
    for (let i = 0; i < reqBody.length; i += 1) {
      if (reqBody[i]['objectId'] === undefined) {
        return 'BadRequest'
      }
      hMap.set(reqBody[i]['objectId'], reqBody[i])
    }
    for (let i = 0; i < mainObject[k].length; i += 1) {
      if (hMap.has(mainObject[k][i]['objectId'])) {
        const tempObj = hMap.get(mainObject[k][i]['objectId'])
        hMap.delete(mainObject[k][i]['objectid'])
        for (const key in tempObj) {
          if (typeof tempObj[key] !== 'string') {
            if (tempObj[key] instanceof Array) {
              mainObject[k][i] = patchList(mainObject[k][i], tempObj[key], key)
            } else {
              mainObject[k][i] = patchObject(
                mainObject[k][i],
                tempObj[key],
                key
              )
            }
          } else {
            mainObject[k][i][key] = tempObj[key]
          }
        }
      }
    }
    for (const [key, value] of hMap) {
      mainObject[k].push(value)
    }
    return mainObject
  } catch (err) {
    logger.error(`Redis Client error`, { error: err })
  }
}
export {
  createETag,
  checkIfPlanExists,
  getPlanETag,
  getPlanService,
  savePlanService,
  deletePlanService,
  patchObject,
  patchList,
  client,
}

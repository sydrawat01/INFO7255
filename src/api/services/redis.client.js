import 'dotenv/config'
import { createClient } from 'redis'
import md5 from 'md5'
import appConfig from '../../configs/app.config'
import logger from '../../configs/logger.config'

const { REDIS_PORT } = appConfig

const client = createClient(REDIS_PORT)
client.connect()
client.on('error', (err) => {
  logger.error(`redis client error`, err)
})
client.on('connect', () => {
  logger.info('Connected to redis')
})

const findPlan = async (key) => {
  const value = await client.hGetAll(key)
  if (value.objectId === key) {
    return value
  }
  return false
}

const addPlan = async (body) => {
  const ETag = md5(body)
  await client.hSet(body.objectId, 'plan', JSON.stringify(body))
  await client.hSet(body.objectId, 'ETag', ETag)
  await client.hSet(body.objectId, 'objectId', body.objectId)
  const newPlan = await findPlan(body.objectId)
  return newPlan
}

const deleteByPlanId = async (planId) => {
  if (await client.del(planId)) {
    return true
  }
  return false
}

export { findPlan, addPlan, deleteByPlanId }

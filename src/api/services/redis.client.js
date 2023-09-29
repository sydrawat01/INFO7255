import 'dotenv/config'
import { createClient } from 'redis'
import appConfig from '../../configs/app.config'
import logger from '../../configs/logger.config'
import md5 from 'md5'

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
  } else {
    return false
  }
}

const addPlan = async (body) => {
  const ETag = md5(body)
  await client.hSet(body.objectId, 'plan', JSON.stringify(body))
  await client.hSet(body.objectId, 'ETag', ETag)
  await client.hSet(body.objectId, 'objectId', body.objectId)
  return await this.findPlan(body.objectId)
}

const delPlan = async () => {}

export { findPlan, addPlan, delPlan }

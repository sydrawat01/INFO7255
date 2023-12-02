import 'dotenv/config'
import { createClient } from 'redis'
import appConfig from '../../configs/app.config'
import logger from '../../configs/logger.config'

const { REDIS_HOST, REDIS_PORT } = appConfig

const client = createClient(REDIS_PORT, REDIS_HOST)

// Redis CONNECT event listener
client.on('connect', () => {
  logger.info('Connected to redis', { REDIS_HOST, REDIS_PORT })
})
// Redis ERROR event listener
client.on('error', (error) => {
  logger.error(`redis client error`, { error })
})

// Connect to the Redis datastore client
client.connect()

const ifKeyExists = async (key) => {
  const data = await client.exists(key)
  return !!data
}

const getETag = async (key) => {
  return await client.hGet(key, 'eTag')
}

const getKeyType = async (key) => {
  return await client.type(key)
}

const setETag = async (key, eTag) => {
  return await client.hSet(key, 'eTag', eTag)
}

const addSetValue = async (key, value) => {
  return await client.sAdd(key, value)
}

const hSet = async (key, field, value) => {
  return await client.hSet(key, field, value)
}

const getKeys = async (pattern) => {
  return await client.keys(pattern)
}

const deleteKeys = async (keys) => {
  return await client.del(keys)
}

const getAllValuesByKey = async (key) => {
  return await client.hGetAll(key)
}

const sMembers = async (key) => {
  return await client.sMembers(key)
}

export {
  ifKeyExists,
  getETag,
  getKeyType,
  setETag,
  addSetValue,
  hSet,
  getKeys,
  deleteKeys,
  getAllValuesByKey,
  sMembers,
}

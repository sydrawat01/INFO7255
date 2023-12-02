import { createHmac } from 'node:crypto'
import {
  getKeyType,
  setETag,
  addSetValue,
  hSet,
  getKeys,
  deleteKeys,
  getAllValuesByKey,
  sMembers,
} from './redis.service'
import logger from '../../configs/logger.config'

const getSavedPlan = async (key) => {
  const output = await getOrDeletePlanData(key, {}, false)
  return output
}

const createSavePlan = async (key, plan) => {
  logger.info(`Create new ETag: planService: 1`)
  await convertJSONToMap(plan)
  logger.info(`Create new ETag: planService: 2`)
  return getOrDeletePlanData(key, {}, false)
}

const convertJSONToMap = async (json) => {
  const valueMap = {}
  const map = {}

  for (let [key, value] of Object.entries(json)) {
    const redisKey = `${json['objectType']}_${json['objectId']}`
    if (Array.isArray(value)) {
      value = await convertToList(value)
      for (let [_, valueArray] of Object.entries(value)) {
        for (let [keyInnerArray, _] of Object.entries(valueArray)) {
          await addSetValue(`${redisKey}_${key}`, keyInnerArray)
        }
      }
    } else if (typeof value === 'object') {
      value = await convertJSONToMap(value)
      const calculatedValue = Object.keys(value)[0]
      await addSetValue(`${redisKey}_${key}`, calculatedValue)
    } else {
      await hSet(redisKey, key, value.toString())
      valueMap[key] = value
      map[redisKey] = valueMap
    }
  }

  return map
}

const convertToList = async (array) => {
  let list = []
  for (let i = 0; i < array.length; i += 1) {
    let value = array[i]
    if (Array.isArray(value)) {
      value = await convertToList(value)
    } else if (typeof value === 'object') {
      value = await convertJSONToMap(value)
    }
    list.push(value)
  }
  return list
}

const getOrDeletePlanData = async (redisKey, outputMap, isDelete) => {
  const keys = await getKeys(`${redisKey}*`)
  for (let l = 0; l < keys.length; l += 1) {
    const key = keys[l]
    const keyType = await getKeyType(key)

    if (key === redisKey) {
      if (isDelete) {
        deleteKeys([key])
      } else {
        // check for valid key type
        if (keyType !== 'hash') {
          logger.error(`Expected hash type for key ${key}, found ${keyType}`, {
            key,
            keyType,
          })
        }
        const val = await getAllValuesByKey(key)
        for (let [keyName, _] of Object.entries(val)) {
          if (keyName.toLowerCase() !== 'etag') {
            outputMap[keyName] = !isNaN(val[keyName])
              ? Number(val[keyName])
              : val[keyName]
          }
        }
      }
    } else {
      const newStr = key.substring(`${redisKey}_`.length)
      if (keyType === 'set') {
        const members = [...(await sMembers(key))]
        if (members.length > 1) {
          const listObj = []
          for (let i = 0; i < members.length; i += 1) {
            const member = members[i]
            if (isDelete) {
              await getOrDeletePlanData(member, null, true)
            } else {
              listObj.push(await getOrDeletePlanData(member, {}, false))
            }
          }
          if (isDelete) {
            await deleteKeys([key])
          } else {
            outputMap[newStr] = listObj
          }
        } else if (isDelete) {
          await deleteKeys([members[0], key])
        } else {
          const val = await getAllValuesByKey(members[0])
          const newMap = {}

          for (let [keyName, _] of Object.entries(val)) {
            newMap[keyName] = !isNaN(val[keyName])
              ? Number(val[keyName])
              : val[keyName]
          }
          outputMap[newStr] = newMap
        }
      } else {
        logger.error(`Unexpected key type ${keyType} for key ${key}`, {
          key,
          keyType,
        })
      }
    }
  }

  logger.info(`OUTPUT MAP`, { outputMap })
  return outputMap
}

const deleteSavedPlan = async (key) => {
  await getOrDeletePlanData(key, {}, true)
}

const generateETag = (key, jsonObject) => {
  const eTag = createHmac('sha256', JSON.stringify(jsonObject)).digest('base64')
  setETag(key, eTag)
  return eTag
}

export {
  getSavedPlan,
  convertJSONToMap,
  createSavePlan,
  getOrDeletePlanData,
  deleteSavedPlan,
  generateETag,
}

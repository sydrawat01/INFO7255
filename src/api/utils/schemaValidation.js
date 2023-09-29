import { Validator } from 'jsonschema'
import { readFileSync } from 'fs'
import md5 from 'md5'

const validator = new Validator()
const schemaData = readFileSync(require.resolve('./schema.json'))
const jsonSchema = JSON.parse(schemaData)

const validate = (reqBody) => {
  if (validator.validate(reqBody, jsonSchema).errors.length < 1) {
    return true
  } else {
    return false
  }
}

const md5hash = (body) => {
  return md5(body)
}

export { validate, md5hash }

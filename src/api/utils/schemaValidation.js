import { Validator } from 'jsonschema'
import { planSchema } from './schema'

const validator = new Validator()

const validateSchema = (reqBody) => {
  if (validator.validate(reqBody, planSchema)) {
    return true
  }
  return false
}

export { validateSchema }

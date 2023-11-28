import Ajv from 'ajv'

const ajvClient = new Ajv({
  allErrors: true,
  async: true,
  strict: false,
})

const parseErrors = async (validationErrors) => {
  const errors = []
  validationErrors.forEach((error) => {
    errors.push(error)
  })
  return errors
}

const validateJSONSchema = async (json, schema) => {
  const validate = ajvClient.compile(schema)
  const valid = await validate(json)
  if (!valid) {
    const errors = await parseErrors(validate.errors)
    return {
      error: true,
      data: errors,
    }
  }
  return {
    error: false,
  }
}

export default validateJSONSchema

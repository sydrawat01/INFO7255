import validateJSONSchema from '../../validations/schema.validation'

export const isValidJSONSchema = async (json, schema) => {
  return await validateJSONSchema(json, schema)
}

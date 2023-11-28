import 'dotenv/config'

const {
  HOSTNAME, // Application hostname
  PORT, // Application port number
  PLAN_TYPE, // plan
  REDIS_HOST, // Redis Datastore hostname
  REDIS_PORT, // Redis Datastore port number
  CLIENT_ID, // Google OAuth ClientID
  ELASTIC_PASSWORD, // Elastic user password
  CERT_PATH, // Elasticsearch certificate
  ELASTIC_BASE_URL, // Elasticsearch base URL
  ELASTICSEARCH_INDEX_NAME, // Elasticsearch index name
  RABBITMQ_QUEUE_NAME, // RabbitMQ Queue Name
  RABBITMQ_EXCHANGE_TYPE, // RabbitMQ exchange type
  RABBITMQ_EXCHANGE_NAME, // RabbitMQ exchange name
  RABBITMQ_KEY, // RabbitMQ key
} = process.env

const appConfig = {
  HOSTNAME,
  PORT,
  PLAN_TYPE,
  REDIS_HOST,
  REDIS_PORT,
  CLIENT_ID,
  ELASTIC_PASSWORD,
  CERT_PATH,
  ELASTIC_BASE_URL,
  ELASTICSEARCH_INDEX_NAME,
  RABBITMQ_QUEUE_NAME,
  RABBITMQ_EXCHANGE_TYPE,
  RABBITMQ_EXCHANGE_NAME,
  RABBITMQ_KEY,
}

export default appConfig

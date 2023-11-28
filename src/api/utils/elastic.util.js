import { Client } from 'elasticsearch'
import fs from 'fs'
import appConfig from '../../configs/app.config'
import logger from '../../configs/logger.config'

const { ELASTIC_PASSWORD, CERT_PATH, ELASTIC_BASE_URL } = appConfig

// Elasticsearch client connection
const elasticClient = new Client({
  host: ELASTIC_BASE_URL,
  // node: ELASTIC_BASE_URL,
  // auth: {
  //   username: 'elastic',
  //   password: ELASTIC_PASSWORD,
  // },
  // tls: {
  //   ca: fs.readFileSync(`${CERT_PATH}/http_ca.crt`),
  //   rejectUnauthorized: false,
  // },
  log: 'trace',
})

elasticClient.cluster.health({}, (err, res, status) => {
  if (res) logger.info(`## CLIENT HEALTH GREEN ##`)
})

export default elasticClient

import { connect } from 'amqplib'
import appConfig from '../../configs/app.config'

const {
  RABBITMQ_QUEUE_NAME,
  RABBITMQ_EXCHANGE_TYPE,
  RABBITMQ_EXCHANGE_NAME,
  RABBITMQ_KEY,
} = appConfig

let channel

const rabbitConnection = () => {
  const connection = connect('amqp://localhost')
  connection.then(async (conn) => {
    channel = await conn.createChannel()
    await channel.assertExchange(RABBITMQ_EXCHANGE_NAME, RABBITMQ_EXCHANGE_TYPE)
    await channel.assertQueue(RABBITMQ_QUEUE_NAME)
    channel.bindQueue(RABBITMQ_QUEUE_NAME, RABBITMQ_EXCHANGE_NAME, RABBITMQ_KEY)
  })
}
rabbitConnection()

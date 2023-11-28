import { connect } from 'amqplib'
import appConfig from '../../configs/app.config'
import { postDocument, deleteDocument } from './elastic.service'

const {
  RABBITMQ_QUEUE_NAME,
  RABBITMQ_EXCHANGE_TYPE,
  RABBITMQ_EXCHANGE_NAME,
  RABBITMQ_KEY,
} = appConfig

let channel
;(() => {
  const connection = connect('amqp://localhost')
  connection.then(async (conn) => {
    channel = await conn.createChannel()
    await channel.assertExchange(RABBITMQ_EXCHANGE_NAME, RABBITMQ_EXCHANGE_TYPE)
    await channel.assertQueue(RABBITMQ_QUEUE_NAME)
    channel.bindQueue(RABBITMQ_QUEUE_NAME, RABBITMQ_EXCHANGE_NAME, RABBITMQ_KEY)
  })
})()

const consumer = async () => {
  return await channel.consume(RABBITMQ_QUEUE_NAME, async (message) => {
    const content = message.content.toString()
    await channel.ack(message)
    const { operation, body } = JSON.parse(content)
    if (operation === 'STORE') {
      await postDocument(body)
    } else if (operation === 'DELETE') {
      await deleteDocument(body)
    }
  })
}

const producer = (content) => {
  channel.sendToQueue(RABBITMQ_QUEUE_NAME, Buffer.from(JSON.stringify(content)))
  setInterval(() => {
    consumer()
  }, 1000)
}

export { producer, consumer }

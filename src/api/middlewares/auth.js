import { OAuth2Client } from 'google-auth-library'
import appConfig from '../../configs/app.config'
import logger from '../../configs/logger.config'

const { CLIENT_ID } = appConfig
export const gClient = new OAuth2Client(CLIENT_ID)

export const auth = async (req, res, next) => {
  try {
    if (req.headers.authorization === null) {
      return res.status(401).send('Unauthorized')
    }
    const token = req.headers['authorization'].split(' ')[1] // extract bearer token
    const ticket = await gClient.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    })
    const payload = ticket.getPayload()
    logger.info(`Authenticated User`, { email: payload.email })
    next()
  } catch (err) {
    logger.error(`Validation error ${err}`)
    return res.status(401).send('Unauthorized')
  }
}

import express from 'express'
import { auth } from '../middlewares/auth'
import {
  savePlan,
  getPlan,
  deletePlan,
  editPlan,
} from '../controllers/plan.controller'

const router = express.Router()

router.route('/plan').post(auth, savePlan)
router
  .route('/plan/:objectId')
  .get(auth, getPlan)
  .delete(auth, deletePlan)
  .patch(auth, editPlan)

export { router as planRoute }

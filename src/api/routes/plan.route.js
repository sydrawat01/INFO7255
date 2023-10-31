import express from 'express'
import { validate } from '../utils/gauth'
import {
  savePlan,
  getPlan,
  deletePlan,
  editPlan,
} from '../controllers/plan.controller'

const router = express.Router()

router.route('/plan').post(validate, savePlan)
router
  .route('/plan/:planId')
  .get(validate, getPlan)
  .delete(validate, deletePlan)
  .patch(editPlan)

export { router as planRoute }

import express from 'express'
import { savePlan, getPlan, deletePlan } from '../controllers/plan.controller'

const router = express.Router()

router.post('/plan', savePlan)
router.get('/plan/:planId', getPlan)
router.delete('/plan/:planId', deletePlan)

export { router as planRoute }

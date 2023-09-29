import express from 'express'
import { savePlan, getPlan, deletePlan } from '../controllers/plan.controller'

const router = express.Router()

router.post('/plan', savePlan)
router.get('/plan/:id', getPlan)
router.delete('/plan', deletePlan)

export { router as planRoute }

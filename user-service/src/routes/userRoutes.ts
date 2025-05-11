import { Router } from "express"
import { getUserInfo } from "../controllers/userController"
import { authenticateToken } from "../middlewares/authMiddleware"

const router = Router()

// Protected route - requires token
router.get("/me", authenticateToken, getUserInfo)

export default router

import { Response } from "express"
import { AuthenticatedRequest } from "../middlewares/authMiddleware" // Import AuthenticatedRequest
import pool from "../config/database"
import { User } from "../models/User"

export const getUserInfo = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  // The user object is attached by the authenticateToken middleware
  const tokenUser = req.user as User & { userId?: number } // More precise type for token payload

  if (!tokenUser || tokenUser.userId === undefined) {
    // Check for undefined explicitly if userId can be 0
    res.status(403).json({ message: "User ID not found in token" })
    return
  }

  try {
    const userResult = await pool.query(
      "SELECT id, firstname, lastname, email, created_at FROM users WHERE id = $1",
      [tokenUser.userId]
    )

    if (userResult.rows.length === 0) {
      res.status(404).json({ message: "User not found" })
      return
    }

    const dbUser: User = userResult.rows[0]

    res.status(200).json({
      id: dbUser.id,
      firstname: dbUser.firstname,
      lastname: dbUser.lastname,
      email: dbUser.email,
      created_at: dbUser.created_at,
    })
  } catch (error) {
    console.error("Error fetching user info:", error)
    res
      .status(500)
      .json({ message: "Server error while fetching user information" })
  }
}

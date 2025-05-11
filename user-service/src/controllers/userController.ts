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
      "SELECT id, firstname, lastname, email, role, created_at FROM users WHERE id = $1",
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
      role: dbUser.role,
      created_at: dbUser.created_at,
    })
  } catch (error) {
    console.error("Error fetching user info:", error)
    res
      .status(500)
      .json({ message: "Server error while fetching user information" })
  }
}

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const numericId = parseInt(id, 10)

  if (isNaN(numericId)) {
    res.status(400).json({ message: "Invalid user ID format" })
    return
  }

  try {
    const userResult = await pool.query(
      "SELECT id, firstname, lastname, email, role, created_at FROM users WHERE id = $1",
      [numericId]
    )

    if (userResult.rows.length === 0) {
      res.status(404).json({ message: "User not found" })
      return
    }

    const dbUser: User = userResult.rows[0]
    res.status(200).json(dbUser)
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    res.status(500).json({ message: "Server error while fetching user" })
  }
}

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { firstname, lastname, email } = req.body
  const numericId = parseInt(id, 10)

  if (isNaN(numericId)) {
    res.status(400).json({ message: "Invalid user ID format" })
    return
  }

  if (!firstname && !lastname && !email) {
    res.status(400).json({
      message:
        "At least one field (firstname, lastname, email) must be provided for update.",
    })
    return
  }

  // Build the query dynamically based on provided fields
  const fieldsToUpdate: string[] = []
  const values: any[] = []
  let paramCount = 1

  if (firstname) {
    fieldsToUpdate.push(`firstname = $${paramCount++}`)
    values.push(firstname)
  }
  if (lastname) {
    fieldsToUpdate.push(`lastname = $${paramCount++}`)
    values.push(lastname)
  }
  if (email) {
    // Optional: Add email format validation here if needed
    fieldsToUpdate.push(`email = $${paramCount++}`)
    values.push(email)
  }

  if (fieldsToUpdate.length === 0) {
    // Should be caught by the earlier check, but as a safeguard
    res.status(400).json({ message: "No valid fields provided for update." })
    return
  }

  values.push(numericId) // For the WHERE id = $N clause

  const queryString = `UPDATE users SET ${fieldsToUpdate.join(
    ", "
  )} WHERE id = $${paramCount} RETURNING id, firstname, lastname, email, role, created_at`

  try {
    const updateResult = await pool.query(queryString, values)

    if (updateResult.rows.length === 0) {
      res.status(404).json({ message: "User not found or no changes made" })
      return
    }
    res.status(200).json({
      message: "User updated successfully",
      user: updateResult.rows[0],
    })
  } catch (error: any) {
    console.error("Error updating user:", error)
    if (error.code === "23505" && error.constraint === "users_email_key") {
      // Handle unique constraint violation for email
      res.status(409).json({
        message: "Email address is already in use by another account.",
      })
    } else {
      res.status(500).json({ message: "Server error while updating user" })
    }
  }
}

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const numericId = parseInt(id, 10)

  if (isNaN(numericId)) {
    res.status(400).json({ message: "Invalid user ID format" })
    return
  }

  // Optional: Prevent users from deleting themselves if that's a requirement
  // if (req.user && req.user.userId === numericId) {
  //   res.status(403).json({ message: "Users cannot delete their own account through this endpoint." });
  //   return;
  // }

  try {
    const deleteResult = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [numericId]
    )

    if (deleteResult.rowCount === 0) {
      res.status(404).json({ message: "User not found" })
      return
    }

    res.status(200).json({
      message: "User deleted successfully",
      userId: deleteResult.rows[0].id,
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ message: "Server error while deleting user" })
  }
}

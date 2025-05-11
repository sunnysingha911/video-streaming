import { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import pool from "../config/database"
import { User } from "../models/User"

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key"
const SALT_ROUNDS = 10

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { firstname, lastname, email, password, confirmPassword } = req.body

  if (!firstname || !lastname || !email || !password || !confirmPassword) {
    res.status(400).json({ message: "All fields are required" })
    return
  }

  if (password !== confirmPassword) {
    res.status(400).json({ message: "Passwords do not match" })
    return
  }

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )
    if (existingUser.rows.length > 0) {
      res.status(409).json({ message: "User already exists with this email" })
      return
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const newUserResult = await pool.query(
      "INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4) RETURNING id, firstname, lastname, email, role, created_at",
      [firstname, lastname, email, hashedPassword]
    )

    const newUser: User = newUserResult.rows[0]

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
}

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" })
    return
  }

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )

    if (userResult.rows.length === 0) {
      res.status(401).json({ message: "Invalid credentials" })
      return
    }

    const user: User = userResult.rows[0]

    // Ensure user.password is defined before comparing
    if (!user.password) {
      res.status(500).json({ message: "User data incomplete in database." })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" })
      return
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" })

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
}

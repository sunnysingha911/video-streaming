import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User" // Assuming User interface is in models

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key"

// Extend Express Request type to include user property
export interface AuthenticatedRequest extends Request {
  user?: User | jwt.JwtPayload // User can be your User interface or JWT payload
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.get("Authorization")
  const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

  if (token == null) {
    res.status(401).json({ message: "Authentication token required" })
    return
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        res.status(403).json({ message: "Token expired" })
        return
      }
      res.status(403).json({ message: "Invalid token" })
      return
    }
    req.user = user as User // Attach user payload to request object
    next()
  })
}

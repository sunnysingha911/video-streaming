import { Response, NextFunction, RequestHandler } from "express"
import { AuthenticatedRequest } from "./authMiddleware"
import { UserRole } from "../models/User"

export const authorizeRoles = (allowedRoles: UserRole[]): RequestHandler => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user || !req.user.role) {
      res
        .status(403)
        .json({ message: "Forbidden: User role not found in token." })
      return
    }

    const userRole = req.user.role as UserRole

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        message: `Forbidden: Role '${userRole}' is not authorized to perform this action. Allowed roles: ${allowedRoles.join(
          ", "
        )}`,
      })
      return
    }
    next()
  }
}

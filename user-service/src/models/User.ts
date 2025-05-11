/**
 * @swagger
 * components:
 *   schemas:
 *     UserRole:
 *       type: string
 *       enum: [user, admin, moderator, superadmin]
 *       description: The role of the user.
 *     User:
 *       type: object
 *       required:
 *         - firstname
 *         - lastname
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the user.
 *           readOnly: true
 *         firstname:
 *           type: string
 *           description: The first name of the user.
 *         lastname:
 *           type: string
 *           description: The last name of the user.
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user.
 *         password:
 *           type: string
 *           format: password
 *           description: The user's password (only for request, not in response unless explicitly stated).
 *           writeOnly: true
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The date and time the user was created.
 *           readOnly: true
 *       example:
 *         id: 1
 *         firstname: "John"
 *         lastname: "Doe"
 *         email: "john.doe@example.com"
 *         role: "user"
 *         created_at: "2023-01-01T12:00:00Z"
 *     UserInput:
 *       type: object
 *       required:
 *         - firstname
 *         - lastname
 *         - email
 *         - password
 *       properties:
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     UserUpdateInput:
 *       type: object
 *       properties:
 *         firstname:
 *           type: string
 *           description: The new first name of the user.
 *         lastname:
 *           type: string
 *           description: The new last name of the user.
 *         email:
 *           type: string
 *           format: email
 *           description: The new email address of the user.
 */
export interface User {
  id?: number
  firstname: string
  lastname: string
  email: string
  password?: string // Password will be hashed and may not always be present in User objects
  role?: UserRole
  created_at?: Date
}

export type UserRole = "user" | "admin" | "moderator" | "superadmin"

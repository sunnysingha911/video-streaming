import { Router } from "express"
import {
  getUserInfo,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController"
import { authenticateToken } from "../middlewares/authMiddleware"
import { authorizeRoles } from "../middlewares/authorizationMiddleware"

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and information retrieval
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication token required
 *       403:
 *         description: Invalid or expired token / User ID not found in token
 *       500:
 *         description: Server error
 */
router.get("/me", authenticateToken, getUserInfo)

// Admin & Superadmin routes - require token and specific roles
const adminOrSuperadminRoles: ("admin" | "superadmin")[] = [
  "admin",
  "superadmin",
]

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (Admin/Superadmin access)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to retrieve.
 *     responses:
 *       200:
 *         description: Successfully retrieved user information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID format.
 *       401:
 *         description: Authentication token required.
 *       403:
 *         description: Forbidden. User does not have the required role (admin/superadmin).
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(adminOrSuperadminRoles),
  getUserById
)

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user by ID (Admin/Superadmin access)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateInput'
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID format or missing update fields.
 *       401:
 *         description: Authentication token required.
 *       403:
 *         description: Forbidden. User does not have the required role (admin/superadmin).
 *       404:
 *         description: User not found or no changes made.
 *       409:
 *         description: Email address is already in use.
 *       500:
 *         description: Server error.
 */
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(adminOrSuperadminRoles),
  updateUser
)

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID (Admin/Superadmin access)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to delete.
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: integer
 *       400:
 *         description: Invalid user ID format.
 *       401:
 *         description: Authentication token required.
 *       403:
 *         description: Forbidden. User does not have the required role (admin/superadmin).
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(adminOrSuperadminRoles),
  deleteUser
)

export default router

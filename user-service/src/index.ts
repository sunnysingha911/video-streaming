import express, { Express, Request, Response, NextFunction } from "express"
import dotenv from "dotenv"
import path from "path"
import pool from "./config/database" // Import the pool
import authRoutes from "./routes/authRoutes"
import userRoutes from "./routes/userRoutes"

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// View engine setup
app.set("views", path.join(__dirname, "..", "views"))
app.set("view engine", "pug")

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)

// Test DB connection
app.get("/test-db", async (req: Request, res: Response) => {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT NOW()")
    res.status(200).json({ now: result.rows[0].now })
    client.release()
  } catch (err) {
    console.error("Database connection error", err)
    // Check if 'err' is an instance of Error before accessing 'stack'
    const errorMessage =
      err instanceof Error ? err.message : "Unknown database error"
    res
      .status(500)
      .json({ error: "Database connection failed", details: errorMessage })
  }
})

app.get("/", (req: Request, res: Response) => {
  res.render("index", { title: "Express User Service" })
})

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something broke!", error: err.message })
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})

export default app

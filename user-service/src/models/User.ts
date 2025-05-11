export interface User {
  id?: number
  firstname: string
  lastname: string
  email: string
  password?: string // Password will be hashed and may not always be present in User objects
  created_at?: Date
}

export interface LoginFormValues {
  email: string
  password: string
}

export interface FieldErrors {
  email?: string
  password?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent'
  workspace_id: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user: AuthUser
}

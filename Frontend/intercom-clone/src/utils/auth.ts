import type { LoginFormValues } from '../types/auth'

export const DUMMY_EMAIL = 'admin@test.com'
export const DUMMY_PASSWORD = '123456'

export function isValidCredentials(values: LoginFormValues) {
  return (
    values.email.trim() === DUMMY_EMAIL &&
    values.password === DUMMY_PASSWORD
  )
}

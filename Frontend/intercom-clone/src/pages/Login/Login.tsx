import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { Input } from '../../components/Input/Input'
import { AuthLayout } from '../../layouts/AuthLayout/AuthLayout'
import type { FieldErrors, LoginFormValues } from '../../types/auth'
import { isValidCredentials } from '../../utils/auth'
import styles from './Login.module.css'

const initialValues: LoginFormValues = {
  email: '',
  password: '',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [authError, setAuthError] = useState('')

  const emailError = errors.email
  const passwordError = errors.password

  const isLoginDisabled =
    values.email.trim() === '' || values.password.trim() === ''

  const handleChange =
    (field: keyof LoginFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value

      setValues((current) => ({
        ...current,
        [field]: nextValue,
      }))
      setAuthError('')
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }))
    }

  const handleBlur = (field: keyof LoginFormValues) => () => {
    setErrors((current) => ({
      ...current,
      [field]:
        values[field].trim() === ''
          ? `${field === 'email' ? 'Email' : 'Password'} is required.`
          : undefined,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FieldErrors = {
      email: values.email.trim() === '' ? 'Email is required.' : undefined,
      password: values.password.trim() === '' ? 'Password is required.' : undefined,
    }

    setErrors(nextErrors)

    if (nextErrors.email || nextErrors.password) {
      return
    }

    if (isValidCredentials(values)) {
      navigate('/admin/dashboard')
      return
    }

    setAuthError('Invalid email or password.')
  }

  return (
    <AuthLayout>
      <Card className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Secure access</p>
          <h2 className={styles.heading}>Sign in to continue</h2>
          <p className={styles.subheading}>
            Use your credentials to access the platform.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            placeholder="admin@test.com"
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            error={emailError}
            autoComplete="email"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            type="password"
            value={values.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            error={passwordError}
            autoComplete="current-password"
          />

          {authError ? <p className={styles.authError}>{authError}</p> : null}

          <Button type="submit" disabled={isLoginDisabled}>
            Login
          </Button>
        </form>

        <div className={styles.footerLinks}>
          <p className={styles.linkText}>Forgot Password?</p>
          <p className={styles.footerText}>Don&apos;t have an account?</p>
        </div>
      </Card>
    </AuthLayout>
  )
}

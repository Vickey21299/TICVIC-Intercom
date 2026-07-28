import type { ChangeEventHandler, FocusEventHandler } from 'react'
import styles from './Input.module.css'

export interface InputProps {
  label: string
  placeholder: string
  type: 'text' | 'email' | 'password'
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  error?: string
  id?: string
  name?: string
  onBlur?: FocusEventHandler<HTMLInputElement>
  autoComplete?: string
}

export function Input({
  label,
  placeholder,
  type,
  value,
  onChange,
  error,
  id,
  name,
  onBlur,
  autoComplete,
}: InputProps) {
  const inputId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        className={`${styles.input}${error ? ` ${styles.inputError}` : ''}`}
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
      />
      {error ? <p className={styles.error}>{error}</p> : <p className={styles.errorSpacer} />}
    </div>
  )
}

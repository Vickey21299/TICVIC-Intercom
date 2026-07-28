import type { ReactNode } from 'react'
import styles from './Card.module.css'

export interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={`${styles.card}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

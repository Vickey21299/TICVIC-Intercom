import styles from './SearchBox.module.css'

type SearchBoxProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Search',
  ariaLabel = 'Search',
}: SearchBoxProps) {
  return (
    <label className={styles.searchBox}>
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" role="presentation">
          <path
            d="M10.5 18a7.5 7.5 0 1 1 5.32-12.82A7.5 7.5 0 0 1 10.5 18Zm0-13.5a6 6 0 1 0 3.77 10.68l4.16 4.16 1.06-1.06-4.16-4.16A6 6 0 0 0 10.5 4.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <input
        className={styles.input}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
  )
}

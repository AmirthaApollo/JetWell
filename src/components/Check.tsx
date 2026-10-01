export function Check({ done, size = 22 }: { done: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`check ${done ? 'is-done' : ''}`}
    >
      <circle cx="12" cy="12" r="10.5" className="check-ring" />
      <path d="M6.5 12.5 10.5 16.5 17.5 8" className="check-tick" />
    </svg>
  );
}

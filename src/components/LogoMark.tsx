export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="logo-mark">
      <path d="M3 17c6-1 13-6 18-13" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="3.5" cy="17" r="2" fill="var(--sand)" />
      <circle cx="20.5" cy="4.5" r="2" fill="var(--indigo)" />
    </svg>
  );
}

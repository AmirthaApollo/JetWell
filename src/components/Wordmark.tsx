import { LogoMark } from './LogoMark';

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="wordmark" aria-label="Jetwell">
      <LogoMark size={size} />
      <span className="wm-text">Jetwell</span>
    </span>
  );
}

/** Deterministic barcode strip for ticket authenticity. */
export function Barcode({ seed, height = 44 }: { seed: string; height?: number }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: { w: number; gap: number }[] = [];
  let x = 0;
  while (x < 150) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const w = 1 + (h % 3);
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const gap = 1 + (h % 3);
    bars.push({ w, gap });
    x += w + gap;
  }
  let cx = 0;
  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 150 44"
      preserveAspectRatio="none"
      role="img"
      aria-label="Ticket barcode"
      className="barcode"
    >
      {bars.map((b, i) => {
        const rect = <rect key={i} x={cx} y="0" width={b.w} height="44" rx="0.5" fill="var(--ink)" />;
        cx += b.w + b.gap;
        return rect;
      })}
    </svg>
  );
}

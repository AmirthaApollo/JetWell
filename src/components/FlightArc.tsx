import { useReducedMotion } from './hooks';

export function FlightArc({
  originCode,
  destCode,
  shiftMinutes,
  originLabel,
  destLabel,
}: {
  originCode: string;
  destCode: string;
  shiftMinutes: number;
  originLabel: string;
  destLabel: string;
}) {
  const reduced = useReducedMotion();
  const bandX = 70;
  const bandW = 760;
  const offset = (shiftMinutes / 1440) * bandW * -1; // dest band phase

  const shiftHours = (Math.abs(shiftMinutes) / 60).toFixed(shiftMinutes % 60 === 0 ? 0 : 1);
  const dir = shiftMinutes > 0 ? 'ahead' : 'behind';

  return (
    <div className={`flightarc ${reduced ? 'no-motion' : ''}`}>
      <svg viewBox="0 0 900 380" width="100%" role="img" aria-label={`Flight from ${originLabel} to ${destLabel}, ${shiftHours} hours ${dir}`}>
        <defs>
          <linearGradient id="daynight" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="var(--indigo)" stopOpacity="0.55" />
            <stop offset="0.12" stopColor="var(--sand)" stopOpacity="0.75" />
            <stop offset="0.5" stopColor="var(--sand)" stopOpacity="0.95" />
            <stop offset="0.88" stopColor="var(--indigo)" stopOpacity="0.6" />
            <stop offset="1" stopColor="var(--indigo)" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Departure band */}
        <g className="band band-origin">
          <text x={bandX} y="112" className="fa-label mono">{originCode} · home clock</text>
          <rect x={bandX} y="124" width={bandW} height="26" rx="13" fill="url(#daynight)" />
          <circle cx={bandX + 120} cy="137" r="6" fill="var(--sand-ink)" />
        </g>

        {/* Flight path */}
        <path
          className="fa-path"
          d={`M ${bandX + 60} 150 C ${bandX + 260} 60, ${bandX + 500} 60, ${bandX + 700} 150`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="6 8"
          strokeLinecap="round"
        />
        <circle className="fa-dot origin-dot" cx={bandX + 60} cy="150" r="7" fill="var(--sand)" />
        <circle className="fa-dot dest-dot" cx={bandX + 700} cy="150" r="7" fill="var(--indigo)" />
        <g className="fa-plane">
          <path
            d="M-7 2 L9 0 L-7 -2 L-4 0 Z"
            transform={`translate(${bandX + 380} 92) rotate(6)`}
            fill="var(--accent)"
          />
        </g>

        {/* Destination band, shifted by the time difference */}
        <g className="band band-dest" style={{ ['--offset' as string]: `${offset}px` }}>
          <text x={bandX} y="256" className="fa-label mono">{destCode} · destination clock</text>
          <rect x={bandX} y="268" width={bandW} height="26" rx="13" fill="url(#daynight)" />
          <circle cx={bandX + 120} cy="281" r="6" fill="var(--indigo-ink)" />
        </g>

        <text x="450" y="330" className="fa-gap">
          The mismatch is the jet lag — your plan eases the bands back into line.
        </text>
      </svg>
      <div className="fa-caption mono">
        {originCode} → {destCode} · {shiftHours}h {dir}
      </div>
    </div>
  );
}

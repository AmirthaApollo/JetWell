import type { ArcSegment, Plan } from '../engine/planEngine';
import { formatDay } from '../lib/time';

const W = 1000;
const H = 198;
const GUTTER = 116;
const PLOT_L = GUTTER;
const PLOT_R = 992;
const SPAN = 48 * 60;

function x(min: number): number {
  const t = Math.max(0, Math.min(1, min / SPAN));
  return PLOT_L + t * (PLOT_R - PLOT_L);
}

function hourLabel(hour: number, hour12: boolean): string {
  const h = ((hour % 24) + 24) % 24;
  if (hour12) {
    const ampm = h < 12 ? 'am' : 'pm';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}${ampm}`;
  }
  return String(h).padStart(2, '0');
}

const ROWS: { type: ArcSegment['type']; label: string; color: string; opacity: number; y: number }[] = [
  { type: 'light', label: 'Get light', color: 'var(--sand)', opacity: 0.95, y: 40 },
  { type: 'avoid', label: 'Avoid light', color: 'var(--indigo)', opacity: 0.6, y: 74 },
  { type: 'sleep', label: 'Sleep', color: 'var(--indigo-ink)', opacity: 0.95, y: 108 },
];

const ROW_H = 24;

export function DayArc({ plan, now, hour12 }: { plan: Plan; now: number; hour12: boolean }) {
  const minutesNow = (now - plan.arcAnchor) / 60000;
  const nowX = x(minutesNow);
  const showNow = minutesNow >= 0 && minutesNow <= SPAN;

  const plotWidth = PLOT_R - PLOT_L;
  const dayStartMin = [0, 1440];

  return (
    <div className="dayarc card">
      <div className="dayarc-head">
        <div>
          <div className="eyebrow">Your first 48 hours at destination</div>
          <div className="dayarc-sub">When to get light, avoid light, and sleep. Times are local to {plan.destTz.split('/').pop()?.replace('_', ' ')}.</div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="A 48 hour chart showing when to get light, avoid light and sleep. The left labels name each row; the bottom shows the two calendar days."
        className="dayarc-svg"
      >
        <defs>
          <clipPath id="arcclip">
            <rect x={PLOT_L} y="36" width={plotWidth} height={108} rx="8" />
          </clipPath>
        </defs>

        {/* plot background */}
        <rect x={PLOT_L} y="36" width={plotWidth} height={108} rx="8" fill="var(--paper-3)" />

        {/* hour gridlines + top axis labels */}
        {Array.from({ length: 9 }).map((_, i) => {
          const min = i * 360;
          const xx = x(min);
          const isDayEdge = min % 1440 === 0;
          return (
            <g key={'tick' + i}>
              <line
                x1={xx}
                y1="36"
                x2={xx}
                y2="144"
                stroke={isDayEdge ? 'var(--hairline-strong)' : 'var(--hairline)'}
                strokeWidth="1"
                strokeDasharray={isDayEdge ? '' : '2 5'}
              />
              <text x={xx} y="28" textAnchor="middle" className="arc-tick-label mono">
                {hourLabel(min / 60, hour12)}
              </text>
            </g>
          );
        })}

        {/* rows */}
        <g clipPath="url(#arcclip)">
          {ROWS.map((row) =>
            plan.arcSegments
              .filter((s) => s.type === row.type)
              .map((s, i) => (
                <rect
                  key={row.type + i}
                  x={x(s.start) + 3}
                  y={row.y}
                  width={Math.max(6, x(s.end) - x(s.start) - 6)}
                  height={ROW_H}
                  rx={ROW_H / 2}
                  fill={row.color}
                  opacity={row.opacity}
                />
              )),
          )}

          {showNow && (
            <line x1={nowX} y1="30" x2={nowX} y2="150" stroke="var(--accent)" strokeWidth="2.5" />
          )}
        </g>

        {/* row labels in the gutter */}
        {ROWS.map((row) => (
          <g key={row.type}>
            <rect x="6" y={row.y + 5} width="14" height="14" rx="4" fill={row.color} opacity={row.opacity} />
            <text x="28" y={row.y + 16} className="arc-row-label">
              {row.label}
            </text>
          </g>
        ))}

        {/* day bands with clear calendar dates */}
        {dayStartMin.map((start, i) => {
          const center = x(start + 720);
          const date = formatDay(new Date(plan.arcAnchor + start * 60000), plan.destTz);
          return (
            <g key={'day' + i}>
              <text x={center} y="172" textAnchor="middle" className="arc-day-label">
                Day {i + 1}
              </text>
              <text x={center} y="188" textAnchor="middle" className="arc-day-date">
                {date}
              </text>
            </g>
          );
        })}

        {/* now pill */}
        {showNow && (
          <g>
            <circle cx={nowX} cy="30" r="4.5" fill="var(--accent)" />
            <g transform={`translate(${Math.max(PLOT_L + 24, Math.min(PLOT_R - 24, nowX))} 0)`}>
              <rect x="-22" y="6" width="44" height="17" rx="8.5" fill="var(--accent)" />
              <text x="0" y="18.5" textAnchor="middle" className="arc-now-pill">
                now
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

import { useMemo } from 'react';
import type { ArcSegment, Plan } from '../engine/planEngine';
import { getZonedParts } from '../lib/time';

const W = 1000;
const SPAN = 48 * 60;

function x(min: number): number {
  return Math.max(0, Math.min(W, (min / SPAN) * W));
}

export function DayArc({
  plan,
  now,
  hour12,
}: {
  plan: Plan;
  now: number;
  hour12: boolean;
}) {
  const rows: { type: ArcSegment['type']; label: string; color: string; y: number }[] = useMemo(
    () => [
      { type: 'light', label: 'Seek light', color: 'var(--sand)', y: 30 },
      { type: 'avoid', label: 'Avoid light', color: 'var(--indigo)', y: 62 },
      { type: 'sleep', label: 'Sleep', color: 'var(--indigo-ink)', y: 94 },
    ],
    [],
  );

  const minutesNow = (now - plan.arcAnchor) / 60000;
  const nowX = x(minutesNow);
  const showNow = minutesNow >= 0 && minutesNow <= SPAN;

  const dayMarks = [0, 1440, 2880].map((m) => ({ x: x(m), m }));

  return (
    <div className="dayarc card">
      <div className="between row" style={{ marginBottom: 4 }}>
        <div>
          <div className="eyebrow">Light &amp; sleep · 48 hours at destination</div>
          <div className="small muted" style={{ marginTop: 4 }}>
            Sand is light to seek, indigo is light to avoid, deep indigo is sleep.
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} 140`}
        width="100%"
        role="img"
        aria-label="A 48 hour band showing when to seek light, avoid light and sleep at your destination."
        className="dayarc-svg"
      >
        <defs>
          <clipPath id="arcclip">
            <rect x="0" y="18" width={W} height="100" rx="10" />
          </clipPath>
        </defs>
        <rect x="0" y="18" width={W} height="100" rx="10" fill="var(--paper-3)" />
        <g clipPath="url(#arcclip)">
          {dayMarks.map((d, i) => (
            <g key={i}>
              <line
                x1={d.x}
                y1="18"
                x2={d.x}
                y2="118"
                stroke="var(--hairline-strong)"
                strokeWidth={i === 1 ? 1.4 : 1}
                strokeDasharray={i === 1 ? '' : '3 5'}
              />
              {[360, 720, 1080].map((h) => (
                <line
                  key={h}
                  x1={x(d.m + h)}
                  y1="18"
                  x2={x(d.m + h)}
                  y2="118"
                  stroke="var(--hairline)"
                  strokeWidth="1"
                />
              ))}
            </g>
          ))}

          {rows.map((row) =>
            plan.arcSegments
              .filter((s) => s.type === row.type)
              .map((s, i) => (
                <rect
                  key={row.type + i}
                  x={x(s.start) + 2}
                  y={row.y}
                  width={Math.max(4, x(s.end) - x(s.start) - 4)}
                  height="20"
                  rx="10"
                  fill={row.color}
                  opacity={row.type === 'avoid' ? 0.55 : 0.92}
                />
              )),
          )}

          {showNow && (
            <g>
              <line x1={nowX} y1="10" x2={nowX} y2="124" stroke="var(--accent)" strokeWidth="2.4" />
              <circle cx={nowX} cy="10" r="4.5" fill="var(--accent)" />
            </g>
          )}
        </g>

        {dayMarks.map((d, i) => {
          const local = getZonedParts(new Date(plan.arcAnchor + d.m * 60000), plan.destTz);
          const label = i === 2 ? 'Day 2 ends' : `Day ${i + 1}`;
          const date = `${local.day}/${local.month}`;
          return (
            <text
              key={'l' + i}
              x={i === 2 ? d.x - 6 : d.x + 6}
              y="135"
              textAnchor={i === 2 ? 'end' : 'start'}
              className="dayarc-label mono"
            >
              {label} · {date}
            </text>
          );
        })}

        {showNow && (
          <text x={nowX} y="9" textAnchor="middle" className="dayarc-now label">
            now
          </text>
        )}
      </svg>

      <div className="arc-legend">
        {rows.map((r) => (
          <span className="arc-key" key={r.type}>
            <span className="arc-swatch" style={{ background: r.color, opacity: r.type === 'avoid' ? 0.55 : 0.92 }} />
            {r.label}
          </span>
        ))}
        <span className="arc-key">
          <span className="arc-swatch now-swatch" />
          Now
        </span>
      </div>
      <span className="sr">
        Times shown in 24-hour clock: {hour12 ? 'off' : 'on'}.
      </span>
    </div>
  );
}

import type { Plan } from '../engine/planEngine';
import type { Trip } from '../store/types';
import { formatDate, formatDateTime, formatDuration, formatTime } from './time';

export function planToText(plan: Plan, trip: Trip, hour12: boolean): string {
  const lines: string[] = [];
  lines.push(`JETLAGGED — ${trip.originCity} → ${trip.destCity}`);
  lines.push(`${trip.originCode} → ${trip.destCode}`);
  lines.push(
    `Departs ${formatDateTime(new Date(plan.departure), trip.originTz, hour12)} · Lands ${formatDateTime(
      new Date(plan.arrival),
      trip.destTz,
      hour12,
    )}`,
  );
  lines.push(`Strategy: ${plan.strategyLine}`);
  const phaseNames: Record<string, string> = { before: 'BEFORE YOU FLY', air: 'IN THE AIR', after: 'AFTER LANDING' };
  for (const phase of ['before', 'air', 'after'] as const) {
    lines.push('');
    lines.push(phaseNames[phase]);
    lines.push('─'.repeat(28));
    for (const item of plan.phases[phase]) {
      lines.push(`${formatTime(new Date(item.at), trip.destTz, hour12)}  ${item.title}`);
      lines.push(`   ${item.why}`);
    }
  }
  lines.push('');
  lines.push('Jetlagged offers general wellness guidance and is not a medical device or diagnostic tool.');
  return lines.join('\n');
}

function icsDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function planToIcs(plan: Plan, trip: Trip): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jetlagged//Recovery plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const item of plan.items) {
    const start = item.at;
    const end = item.endAt ?? item.at + (item.durationMin ?? 20) * 60000;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${trip.id}-${item.id}@jetlagged`);
    lines.push(`DTSTAMP:${icsDate(Date.now())}`);
    lines.push(`DTSTART:${icsDate(start)}`);
    lines.push(`DTEND:${icsDate(end)}`);
    lines.push(`SUMMARY:${escapeIcs('Jetlagged · ' + item.title)}`);
    lines.push(`DESCRIPTION:${escapeIcs(item.why + ' ' + item.more)}`);
    lines.push(`LOCATION:${escapeIcs(`${trip.destCity} · ${trip.destCode}`)}`);
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT10M');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${escapeIcs(item.title)}`);
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadFile(filename: string, content: string, type = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function tripTitle(trip: Trip): string {
  return `${trip.originCode}-${trip.destCode}-${formatDate(new Date(trip.departureISO), trip.originTz).replace(/\s/g, '')}`;
}

export function durationLabel(minutes: number): string {
  return formatDuration(minutes);
}

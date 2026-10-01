import type { SVGProps } from 'react';
import type { ItemKind } from '../engine/planEngine';

export type IconName =
  | 'sleep'
  | 'light'
  | 'avoid-light'
  | 'caffeine'
  | 'hydrate'
  | 'meal'
  | 'move'
  | 'nap'
  | 'bed'
  | 'note'
  | 'rest'
  | 'plane'
  | 'check'
  | 'clock'
  | 'arrow'
  | 'calendar'
  | 'share'
  | 'print'
  | 'download'
  | 'close'
  | 'chevron'
  | 'menu'
  | 'spark'
  | 'plus'
  | 'trash'
  | 'copy'
  | 'info'
  | 'refresh'
  | 'globe';

const paths: Record<IconName, JSX.Element> = {
  sleep: (
    <>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      <path d="M17 3.5h3l-3 3h3" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  'avoid-light': (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M2 12h2M20 12h2M4.9 19.1l1.4-1.4" />
      <path d="M4 4l16 16" />
    </>
  ),
  caffeine: (
    <>
      <path d="M5 8h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" />
      <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3v2M11 3v2M14 3v2" />
    </>
  ),
  hydrate: <path d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10Z" />,
  meal: (
    <>
      <path d="M6 3v8a3 3 0 0 0 6 0V3M9 3v18" />
      <path d="M17 3c-1.7 1-2.5 3-2.5 5.5S15.3 12 17 12v9" />
    </>
  ),
  move: (
    <>
      <circle cx="12.5" cy="4.5" r="1.6" />
      <path d="M12 7l-2 4 2.5 2 1 5M10 11H6M14.5 9.5 18 11l-1 4" />
    </>
  ),
  nap: (
    <>
      <path d="M3 16h18" />
      <path d="M6 16v-3a6 6 0 0 1 12 0v3" />
      <path d="M9 5h4l-4 4h4" />
    </>
  ),
  bed: (
    <>
      <path d="M3 8v10M3 12h18a0 0 0 0 1 0 0v6M21 18v-4a2 2 0 0 0-2-2H3" />
      <path d="M7 12V9h4a2 2 0 0 1 2 2v1" />
    </>
  ),
  note: (
    <>
      <path d="M5 4h11l3 3v13H5Z" />
      <path d="M8 10h8M8 14h6" />
    </>
  ),
  rest: (
    <>
      <rect x="6" y="5" width="3.5" height="14" rx="1" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" />
    </>
  ),
  plane: <path d="M3 13.5 21 4l-4.5 16-3-5-5.5-1.5Z" />,
  check: <path d="M4 12.5 9.5 18 20 6.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M8 3.5v4M16 3.5v4" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="M8.2 10.8 14.8 7.2M8.2 13.2l6.6 3.6" />
    </>
  ),
  print: (
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7" rx="2" />
      <path d="M7 14h10v6H7Z" />
    </>
  ),
  download: <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="M8 10l4 4 4-4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 1 0-2 6M20 5v6h-6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c3 3.5 3 13.5 0 17M12 3.5c-3 3.5-3 13.5 0 17" />
    </>
  ),
};

export function kindIcon(kind: ItemKind): IconName {
  switch (kind) {
    case 'sleep':
    case 'bed':
      return 'bed';
    case 'light':
      return 'light';
    case 'avoid-light':
      return 'avoid-light';
    case 'caffeine':
      return 'caffeine';
    case 'hydrate':
      return 'hydrate';
    case 'meal':
      return 'meal';
    case 'move':
      return 'move';
    case 'nap':
      return 'nap';
    case 'rest':
      return 'rest';
    default:
      return 'note';
  }
}

export function Icon({
  name,
  size = 20,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}

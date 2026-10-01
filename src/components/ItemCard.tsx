import { useState } from 'react';
import type { PlanItem } from '../engine/planEngine';
import { Check } from './Check';
import { Icon, kindIcon } from './Icon';
import { formatDay, formatTime } from '../lib/time';

const KIND_LABEL: Record<PlanItem['kind'], string> = {
  sleep: 'Sleep',
  light: 'Seek light',
  'avoid-light': 'Avoid light',
  caffeine: 'Caffeine',
  hydrate: 'Hydrate',
  meal: 'Meal',
  move: 'Movement',
  nap: 'Nap',
  bed: 'Bedtime',
  note: 'Note',
  rest: 'Rest',
};

export function ItemCard({
  item,
  primaryTz,
  secondaryTz,
  secondaryLabel,
  hour12,
  done,
  missed,
  onToggle,
  innerRef,
}: {
  item: PlanItem;
  primaryTz: string;
  secondaryTz: string;
  secondaryLabel: string;
  hour12: boolean;
  done: boolean;
  missed: boolean;
  onToggle: () => void;
  innerRef?: (el: HTMLElement | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const at = new Date(item.at);

  return (
    <article
      ref={innerRef}
      className={`item ${done ? 'done' : ''} ${item.highlight ? 'highlight' : ''} ${missed ? 'missed' : ''}`}
      aria-label={`${item.title}. ${done ? 'Completed.' : ''}`}
    >
      <div className="it-time">
        <span className="dest">{formatTime(at, primaryTz, hour12)}</span>
        <span className="home">
          {formatTime(at, secondaryTz, hour12)} {secondaryLabel}
        </span>
        <span className="daytag">{formatDay(at, primaryTz)}</span>
      </div>

      <div className="it-body" onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer' }}>
        <div className="it-title">
          <span className={`k-ico k-${item.kind}`} title={KIND_LABEL[item.kind]}>
            <Icon name={kindIcon(item.kind)} size={15} />
          </span>
          {item.title}
        </div>
        <p className="it-why">{item.why}</p>
        {open && <div className="it-more">{item.more}</div>}
        <div className="it-foot">
          <span className="tiny muted">{KIND_LABEL[item.kind]}</span>
          <button
            className={`learn ${open ? 'open' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-expanded={open}
          >
            {open ? 'Less' : 'Learn more'} <Icon name="chevron" size={14} />
          </button>
        </div>
      </div>

      <button
        className="it-check"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? `Mark ${item.title} as not done` : `Mark ${item.title} as done`}
      >
        <Check done={done} />
      </button>
    </article>
  );
}

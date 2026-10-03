import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Section header with an icon badge, eyebrow and title, plus an optional action. */
export function SectionHead({
  icon,
  eyebrow,
  title,
  action,
}: {
  icon: IconName;
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div className="sh-left">
        <span className="sh-icon" aria-hidden="true">
          <Icon name={icon} size={18} />
        </span>
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h2 className="sh-title">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

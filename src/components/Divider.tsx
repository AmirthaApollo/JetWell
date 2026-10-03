import { Icon, type IconName } from './Icon';

/** A decorative perforated separator with a small travel motif. */
export function Divider({ icon = 'plane' }: { icon?: IconName }) {
  return (
    <div className="divider" aria-hidden="true">
      <span className="divider-line" />
      <span className="divider-mark">
        <Icon name={icon} size={13} />
      </span>
      <span className="divider-line" />
    </div>
  );
}

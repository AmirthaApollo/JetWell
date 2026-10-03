import { Barcode } from './Barcode';
import { Icon } from './Icon';

/** The app intro, presented as a boarding-pass style flight ticket. */
export function IntroTicket({ onRecover, onPlan }: { onRecover: () => void; onPlan: () => void }) {
  return (
    <div className="iticket ticket">
      <div className="ft-top">
        <span className="ft-air">
          <Icon name="plane" size={15} /> JetWell
        </span>
        <span className="ft-class mono">RECOVERY PLAN</span>
      </div>

      <div className="iticket-route">
        <div className="ft-end">
          <span className="ft-code mono">HOME</span>
          <span className="ft-city">Your time</span>
          <span className="ft-date">the clock you leave</span>
        </div>
        <div className="ft-mid" aria-hidden="true">
          <svg viewBox="0 0 160 40" width="100%">
            <path
              d="M4 32 C 46 6, 114 6, 156 32"
              fill="none"
              stroke="var(--hairline-strong)"
              strokeWidth="1.5"
              strokeDasharray="4 5"
            />
            <circle cx="4" cy="32" r="4" fill="var(--sand)" />
            <circle cx="156" cy="32" r="4" fill="var(--accent)" />
            <path d="M-8 2 L10 0 L-8 -2 L-5 0 Z" transform="translate(80 9) rotate(3)" fill="var(--accent)" />
          </svg>
        </div>
        <div className="ft-end end">
          <span className="ft-code mono">AWAY</span>
          <span className="ft-city">Local time</span>
          <span className="ft-date">the clock you land in</span>
        </div>
      </div>

      <ol className="iticket-steps">
        <li className="istep">
          <span className="num mono">01</span>
          <span>Enter your flight</span>
        </li>
        <li className="istep">
          <span className="num mono">02</span>
          <span>See your time zones</span>
        </li>
        <li className="istep">
          <span className="num mono">03</span>
          <span>Get your recovery plan</span>
        </li>
      </ol>

      <div className="ft-stub">
        <div className="ft-barcode">
          <Barcode seed="jetwell-intro" />
        </div>
        <div className="iticket-cta">
          <button className="btn btn-accent" onClick={onRecover}>
            See how to recover <Icon name="arrow" size={16} />
          </button>
          <button className="btn-quiet" onClick={onPlan}>
            Plan my trip
          </button>
        </div>
      </div>
    </div>
  );
}

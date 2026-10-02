import { useMemo } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { FlightTicket } from '../components/FlightTicket';
import { Icon } from '../components/Icon';
import { buildPlan } from '../engine/planEngine';
import { tripToInput } from '../store/seed';

export function Landing() {
  const { navigate } = useRouter();
  const { trips, setActive, activeTrip, prefs } = useStore();

  const upcoming = useMemo(() => {
    const now = Date.now();
    if (activeTrip && new Date(activeTrip.arrivalISO).getTime() > now) return activeTrip;
    const future = trips
      .filter((t) => new Date(t.arrivalISO).getTime() > now)
      .sort((a, b) => new Date(a.departureISO).getTime() - new Date(b.departureISO).getTime());
    return future[0] ?? trips[0] ?? null;
  }, [trips, activeTrip]);

  const plan = useMemo(() => (upcoming ? buildPlan(tripToInput(upcoming)) : null), [upcoming]);

  function openPlan() {
    if (upcoming) setActive(upcoming.id);
    navigate('itinerary');
  }

  function tryExample() {
    const demo = trips.find((t) => t.isDemo) ?? trips[0];
    if (demo) setActive(demo.id);
    navigate('journey');
  }

  return (
    <div className="landing">
      <section className="flight-hero">
        <div className="hero-copy">
          <span className="pre">Your next trip</span>
          <h1>Land ready.</h1>
          <p className="lede">A recovery plan for your body clock when you cross time zones.</p>
          <div className="cta-row">
            <button className="btn btn-primary" onClick={() => navigate('plan')}>
              Plan my trip <Icon name="arrow" size={17} />
            </button>
            <button className="btn btn-ghost" onClick={openPlan}>
              Open my plan
            </button>
          </div>
          <button className="example-link" onClick={tryExample}>
            Try an example: Delhi to London
          </button>
        </div>
        <div className="hero-ticket">
          <FlightTicket
            trip={upcoming}
            plan={plan}
            hour12={prefs.hour12}
            onOpen={openPlan}
            onNew={() => navigate('plan')}
          />
        </div>
      </section>

      <section className="benefits">
        <div className="benefit compact">
          <Icon name="bed" size={20} />
          <span>Know when to sleep, and when not to</span>
        </div>
        <div className="benefit compact">
          <Icon name="light" size={20} />
          <span>Get light at the right time</span>
        </div>
        <div className="benefit compact">
          <Icon name="spark" size={20} />
          <span>Arrive feeling like yourself</span>
        </div>
      </section>

      <section className="how">
        <div className="how-step">
          <span className="num mono">01</span>
          <span>Add your flight</span>
        </div>
        <div className="how-step">
          <span className="num mono">02</span>
          <span>Get your timeline</span>
        </div>
        <div className="how-step">
          <span className="num mono">03</span>
          <span>Follow it, loosely</span>
        </div>
      </section>

      <footer className="footer-note">
        Jetwell offers general wellness guidance and is not a medical device or diagnostic tool.
      </footer>
    </div>
  );
}

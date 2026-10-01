import { useMemo } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { FlightArc } from '../components/FlightArc';
import { Icon } from '../components/Icon';
import { buildPlan } from '../engine/planEngine';
import { tripToInput } from '../store/seed';

export function Landing() {
  const { navigate } = useRouter();
  const { trips, setActive } = useStore();

  const demo = trips.find((t) => t.isDemo) ?? trips[0];
  const plan = useMemo(() => (demo ? buildPlan(tripToInput(demo)) : null), [demo]);

  return (
    <div className="landing">
      <section className="hero">
        <div>
          <span className="pre">Tell us where you're going.</span>
          <h1>Land ready.</h1>
          <p className="lede">
            We'll plan your sleep, light and caffeine around the clock you're leaving and the one you're landing in.
          </p>
          <div className="cta-row">
            <button className="btn btn-primary" onClick={() => navigate('plan')}>
              Plan my trip <Icon name="arrow" size={17} />
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (demo) setActive(demo.id);
                navigate('itinerary');
              }}
            >
              See an example
            </button>
          </div>
        </div>
        <div>
          {plan && demo ? (
            <FlightArc
              originCode={demo.originCode}
              destCode={demo.destCode}
              originLabel={demo.originCity}
              destLabel={demo.destCity}
              shiftMinutes={plan.shiftMinutes}
            />
          ) : null}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>What you get</h2>
        </div>
        <div className="benefits">
          <div className="benefit">
            <div className="b-ico">
              <Icon name="bed" size={22} />
            </div>
            <h3>Know when to sleep, and when not to</h3>
            <p>Clear windows in the air and after landing, in both time zones.</p>
          </div>
          <div className="benefit">
            <div className="b-ico">
              <Icon name="light" size={22} />
            </div>
            <h3>Get light at the right time</h3>
            <p>Seek it in the morning or evening depending on which way you fly.</p>
          </div>
          <div className="benefit">
            <div className="b-ico">
              <Icon name="spark" size={22} />
            </div>
            <h3>Arrive feeling like yourself</h3>
            <p>A calm, step-by-step plan instead of a sleep-science lecture.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>How it works</h2>
        </div>
        <div className="how">
          <div className="how-step">
            <div className="num mono">01</div>
            <h4>Add your flight</h4>
            <p>Where you're going, when you leave and land, and your usual rhythm.</p>
          </div>
          <div className="how-step">
            <div className="num mono">02</div>
            <h4>Get your timeline</h4>
            <p>Before, in the air and after landing — each step timed and explained.</p>
          </div>
          <div className="how-step">
            <div className="num mono">03</div>
            <h4>Follow it, loosely</h4>
            <p>No need to be perfect. Even half of this plan helps.</p>
          </div>
        </div>
      </section>

      <footer className="footer-note">
        Jetlagged offers general wellness guidance based on how body clocks commonly respond to light, sleep timing
        and caffeine. It is not a medical device or diagnostic tool.
      </footer>
    </div>
  );
}

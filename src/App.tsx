import { useEffect, useMemo, useRef } from 'react';
import { RouterProvider, useRouter, type Route } from './router';
import { useStore } from './store/store';
import { useNow } from './components/hooks';
import { Icon, type IconName } from './components/Icon';
import { Wordmark } from './components/Wordmark';
import { useToast } from './components/Toast';
import { buildPlan } from './engine/planEngine';
import { tripToInput } from './store/seed';
import { Landing } from './screens/Landing';
import { Planner } from './screens/Planner';
import { Journey } from './screens/Journey';
import { Schedule } from './screens/Schedule';
import { Calendar } from './screens/Calendar';
import { Itinerary } from './screens/Itinerary';
import { Reset } from './screens/Reset';
import { CheckInScreen } from './screens/CheckInScreen';
import { Profile } from './screens/Profile';

const NAV: { route: Route; label: string; icon: IconName }[] = [
  { route: 'landing', label: 'Home', icon: 'plane' },
  { route: 'itinerary', label: 'Itinerary', icon: 'calendar' },
  { route: 'journey', label: 'Time zones', icon: 'globe' },
  { route: 'schedule', label: 'Commitments', icon: 'clock' },
  { route: 'calendar', label: 'Schedule', icon: 'calendar' },
  { route: 'reset', label: 'Reset', icon: 'light' },
  { route: 'checkin', label: 'Check-in', icon: 'info' },
  { route: 'profile', label: 'Profile', icon: 'note' },
];

const MOBILE_TABS: Route[] = ['itinerary', 'journey', 'schedule', 'calendar', 'profile'];

export function App() {
  return (
    <RouterProvider initial="landing">
      <Shell />
    </RouterProvider>
  );
}

function Shell() {
  const { route, navigate } = useRouter();
  const { activeTrip } = useStore();
  const isHome = route === 'landing';

  return (
    <>
      <a className="sr" href="#main">
        Skip to content
      </a>
      <div className={`app${isHome ? ' home' : ''}`}>
        {!isHome && (
          <aside className="sidebar" aria-label="Primary">
            <button onClick={() => navigate('landing')} aria-label="Jetwell home" style={{ alignSelf: 'flex-start' }}>
              <Wordmark />
            </button>
            <nav className="nav">
              {NAV.map((n) => (
                <button
                  key={n.route}
                  className={`nav-item ${route === n.route ? 'active' : ''}`}
                  onClick={() => navigate(n.route)}
                  aria-current={route === n.route ? 'page' : undefined}
                >
                  <Icon name={n.icon} size={18} />
                  {n.label}
                </button>
              ))}
            </nav>
            <div className="sidebar-foot">Land ready.</div>
          </aside>
        )}

        <div className="main">
          {!isHome && (
            <header className="mobile-top">
              <button onClick={() => navigate('landing')} aria-label="Jetwell home">
                <Wordmark />
              </button>
              <button
                className="btn-quiet"
                onClick={() => navigate('plan')}
                aria-label="Plan a new trip"
                style={{ minHeight: 36, padding: 8 }}
              >
                <Icon name="plus" size={20} />
              </button>
            </header>
          )}
          <main className="content" id="main">
            <Screen route={route} />
          </main>
        </div>

        {!isHome && (
          <nav className="tabbar" aria-label="Primary">
            {MOBILE_TABS.map((r) => {
              const n = NAV.find((x) => x.route === r)!;
              return (
                <button
                  key={n.route}
                  className={`tab ${route === n.route ? 'active' : ''}`}
                  onClick={() => navigate(n.route)}
                  aria-current={route === n.route ? 'page' : undefined}
                >
                  <Icon name={n.icon} />
                  {n.label}
                </button>
              );
            })}
          </nav>
        )}
        {!isHome && (
          <button className="fab" onClick={() => navigate('checkin')} aria-label="How I'm feeling">
            <Icon name="globe" size={22} />
          </button>
        )}
      </div>
      {activeTrip && route !== 'landing' && route !== 'plan' && <GentleNotifications />}
    </>
  );
}

function Screen({ route }: { route: Route }) {
  switch (route) {
    case 'landing':
      return <Landing />;
    case 'plan':
      return <Planner />;
    case 'edit':
      return <Planner edit />;
    case 'journey':
      return <Journey />;
    case 'schedule':
      return <Schedule />;
    case 'calendar':
      return <Calendar />;
    case 'itinerary':
      return <Itinerary />;
    case 'reset':
      return <Reset />;
    case 'checkin':
      return <CheckInScreen />;
    case 'profile':
      return <Profile />;
    default:
      return <Itinerary />;
  }
}

/** In-app, gentle preview of upcoming steps while the app is open. */
function GentleNotifications() {
  const { activeTrip, prefs, dismissedTips, dismissTip } = useStore();
  const { push } = useToast();
  const now = useNow(30000);
  const fired = useRef<Set<string>>(new Set());

  const plan = useMemo(() => (activeTrip ? buildPlan(tripToInput(activeTrip)) : null), [activeTrip]);

  useEffect(() => {
    if (!plan || !prefs.notifications) return;
    for (const item of plan.items) {
      const id = `${activeTrip!.id}:${item.id}`;
      const due = now - item.at;
      if (due >= 0 && due < 60000 && !fired.current.has(id) && !dismissedTips[id]) {
        fired.current.add(id);
        push({ title: item.title, body: item.why, icon: 'spark' });
        dismissTip(id);
      }
    }
  }, [plan, now, prefs.notifications, activeTrip, dismissedTips, dismissTip, push]);

  return null;
}

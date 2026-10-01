import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Route =
  | 'landing'
  | 'plan'
  | 'itinerary'
  | 'now'
  | 'reset'
  | 'checkin'
  | 'trips'
  | 'profile';

const VALID: Route[] = ['landing', 'plan', 'itinerary', 'now', 'reset', 'checkin', 'trips', 'profile'];

interface RouterValue {
  route: Route;
  navigate: (r: Route) => void;
}

const Ctx = createContext<RouterValue>({ route: 'itinerary', navigate: () => {} });

function parse(): Route | null {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (VALID as string[]).includes(h) ? (h as Route) : null;
}

export function RouterProvider({ children, initial }: { children: ReactNode; initial: Route }) {
  const [route, setRoute] = useState<Route>(() => parse() ?? initial);

  useEffect(() => {
    const on = () => {
      const r = parse();
      if (r) setRoute(r);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const navigate = useCallback((r: Route) => {
    setRoute(r);
    window.location.hash = '/' + r;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return <Ctx.Provider value={{ route, navigate }}>{children}</Ctx.Provider>;
}

export function useRouter(): RouterValue {
  return useContext(Ctx);
}

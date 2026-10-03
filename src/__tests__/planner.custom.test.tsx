// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from '../App';
import { StoreProvider } from '../store/store';
import { ToastProvider } from '../components/Toast';

function renderApp() {
  return render(
    <StoreProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StoreProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  vi.restoreAllMocks();
});

afterEach(() => cleanup());

function openPlanner() {
  fireEvent.click(screen.getByText(/Plan my recovery/i));
  expect(screen.getByText(/Add a flight/i)).toBeTruthy();
}

describe('planner: anywhere-in-the-world destination and flight time', () => {
  it('lets the traveller add a custom city and choose its time zone', () => {
    renderApp();
    openPlanner();

    // To field: type a place that is not in the built-in list.
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Longyearbyen' } });

    fireEvent.click(screen.getByText(/Add .Longyearbyen./i));
    expect(screen.getByText(/Time zone for/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'reykjavik' } });
    fireEvent.click(screen.getByText(/Atlantic\/Reykjavik/));

    expect(screen.getByText('Longyearbyen')).toBeTruthy();
  });

  it('exposes a flight time (hours + minutes) and computes the landing', () => {
    renderApp();
    openPlanner();

    // Pick a built-in origin.
    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Delhi' } });
    fireEvent.click(screen.getByText('Delhi'));

    // Add a custom destination anywhere in the world.
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Longyearbyen' } });
    fireEvent.click(screen.getByText(/Add .Longyearbyen./i));
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'reykjavik' } });
    fireEvent.click(screen.getByText(/Atlantic\/Reykjavik/));

    // The flight-time slot is on the same page as the cities.
    expect(screen.getByText(/Flight time . hours/i)).toBeTruthy();
    expect(screen.getByLabelText(/^Minutes$/i)).toBeTruthy();
    expect(screen.getByText(/You land in Longyearbyen/i)).toBeTruthy();
  });

  it('lets an existing flight be rescheduled (edit destination/time)', () => {
    renderApp();

    fireEvent.click(screen.getByText(/Get Started/i));
    fireEvent.click(screen.getAllByText('Itinerary')[0]);
    fireEvent.click(screen.getByText(/Edit flight/i));

    // Prefilled from the active trip.
    expect(screen.getByText(/Add a flight/i)).toBeTruthy();
    expect(screen.getByText('Delhi')).toBeTruthy();
    expect(screen.getByText('London')).toBeTruthy();
    expect(screen.getByText(/Flight time . hours/i)).toBeTruthy();

    // Advance to the final step and save.
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText(/Continue/i));
    }
    expect(screen.getByText(/Save changes/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/Save changes/i));

    expect(screen.getByRole('heading', { name: /Your recovery plan/i })).toBeTruthy();
  });
});

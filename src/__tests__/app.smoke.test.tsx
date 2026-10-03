// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
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

afterEach(() => {
  cleanup();
});

describe('app smoke tests', () => {
  // The home page is a full-screen intro with no nav, so enter the app first.
  function enterApp() {
    fireEvent.click(screen.getByText(/Get Started/i));
  }

  it('opens on the home page on first load', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: /Beat jet lag/i })).toBeTruthy();
    expect(screen.getByText(/Enter your flight, see how your body clock/i)).toBeTruthy();
  });

  it('renders the seeded itinerary after navigating', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Itinerary')[0]);
    expect(screen.getByText(/Your recovery plan/i)).toBeTruthy();
    expect(screen.getByText('Before you fly')).toBeTruthy();
    expect(screen.getByText('In the air')).toBeTruthy();
    expect(screen.getByText('After you land')).toBeTruthy();
  });

  it('has working primary navigation', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Schedule')[0]);
    expect(screen.getByText(/Your travel schedule/i)).toBeTruthy();
  });

  it('opens the planner from the schedule and advances a step', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Schedule')[0]);
    fireEvent.click(screen.getByText(/New trip/i));
    expect(screen.getByText(/Add a flight/i)).toBeTruthy();
  });

  it('toggles an itinerary item', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Itinerary')[0]);
    const before = screen.getAllByRole('button', { name: /Mark .* as done/i }).length;
    fireEvent.click(screen.getAllByRole('button', { name: /Mark .* as done/i })[0]);
    expect(screen.getAllByRole('button', { name: /as not done/i }).length).toBe(1);
    expect(before).toBeGreaterThan(0);
  });

  it('switches the time zone toggle', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Itinerary')[0]);
    const group = screen.getByRole('group', { name: /Time zone display/i });
    const buttons = within(group).getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('opens and runs a reset tool', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Reset')[0]);
    expect(screen.getByText(/Small tools/i)).toBeTruthy();
    fireEvent.click(screen.getByText('Breathing'));
    expect(screen.getByText(/Follow the circle/i)).toBeTruthy();
  });

  it('reflects added commitments in the itinerary', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Commitments')[0]);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Client kickoff' } });
    fireEvent.click(screen.getByText(/Add to Day 1/i));
    fireEvent.click(screen.getAllByText('Itinerary')[0]);
    expect(screen.getByText('Client kickoff')).toBeTruthy();
  });

  it('returns to the landing page from the wordmark', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByRole('button', { name: /Jetwell home/i })[0]);
    expect(screen.getByRole('heading', { name: /Beat jet lag/i })).toBeTruthy();
    expect(screen.getByText(/Enter your flight, see how your body clock/i)).toBeTruthy();
  });

  it('renders the time zones of my journey', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Time zones')[0]);
    expect(screen.getByText(/Time zones of my journey/i)).toBeTruthy();
    expect(screen.getAllByText(/local now/i).length).toBeGreaterThan(0);
  });

  it('renders the commitments screen and adds an item', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Commitments')[0]);
    expect(screen.getByRole('heading', { name: /Commitments/i })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Client call' } });
    fireEvent.click(screen.getByText(/Add to Day 1/i));
    expect(screen.getByText('Client call')).toBeTruthy();
  });

  it('renders the trip schedule with weekday headers', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Schedule')[0]);
    expect(screen.getByText(/Your travel schedule/i)).toBeTruthy();
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Sun')).toBeTruthy();
  });

  it('renders the check-in screen', () => {
    renderApp();
    enterApp();
    fireEvent.click(screen.getAllByText('Check-in')[0]);
    expect(screen.getByText(/How I'm feeling/i)).toBeTruthy();
    expect(screen.getByText(/Save check-in/i)).toBeTruthy();
  });
});

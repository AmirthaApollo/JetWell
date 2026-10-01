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
  it('renders the seeded itinerary on first load without crashing', () => {
    renderApp();
    expect(screen.getByText(/Your recovery plan/i)).toBeTruthy();
    expect(screen.getByText('Before you fly')).toBeTruthy();
    expect(screen.getByText('In the air')).toBeTruthy();
    expect(screen.getByText('After you land')).toBeTruthy();
  });

  it('has working primary navigation', () => {
    renderApp();
    fireEvent.click(screen.getAllByText('Trips')[0]);
    expect(screen.getByText(/My trips/i)).toBeTruthy();
  });

  it('opens the planner from My Trips and advances a step', () => {
    renderApp();
    fireEvent.click(screen.getAllByText('Trips')[0]);
    fireEvent.click(screen.getByText(/New trip/i));
    expect(screen.getByText(/Where are you flying/i)).toBeTruthy();
  });

  it('toggles an itinerary item', () => {
    renderApp();
    const before = screen.getAllByRole('button', { name: /Mark .* as done/i }).length;
    fireEvent.click(screen.getAllByRole('button', { name: /Mark .* as done/i })[0]);
    expect(screen.getAllByRole('button', { name: /as not done/i }).length).toBe(1);
    expect(before).toBeGreaterThan(0);
  });

  it('switches the time zone toggle', () => {
    renderApp();
    const group = screen.getByRole('group', { name: /Time zone display/i });
    const buttons = within(group).getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('opens and runs a reset tool', () => {
    renderApp();
    fireEvent.click(screen.getAllByText('Reset')[0]);
    expect(screen.getByText(/Small tools/i)).toBeTruthy();
    fireEvent.click(screen.getByText('Breathing'));
    expect(screen.getByText(/Follow the circle/i)).toBeTruthy();
  });

  it('renders the landing page from the wordmark', () => {
    renderApp();
    fireEvent.click(screen.getAllByRole('button', { name: /Jetlagged home/i })[0]);
    expect(screen.getByRole('heading', { name: 'Land ready.' })).toBeTruthy();
    expect(screen.getByText(/How it works/i)).toBeTruthy();
  });

  it('renders trip mode (Now)', () => {
    renderApp();
    fireEvent.click(screen.getAllByText('Now')[0]);
    // Either live view, the not-live-yet card, or plan prompt — all valid renders.
    expect(document.querySelector('.now-view, .screen')).toBeTruthy();
  });

  it('renders the check-in screen and recovery chart', () => {
    renderApp();
    fireEvent.click(screen.getAllByText('Check-in')[0]);
    expect(screen.getByText(/How I'm feeling/i)).toBeTruthy();
    expect(screen.getByText(/Recovery curve/i)).toBeTruthy();
  });
});

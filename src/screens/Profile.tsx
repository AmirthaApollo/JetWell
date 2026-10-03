import { useState } from 'react';
import { useStore } from '../store/store';
import { CitySearch } from '../components/CitySearch';
import { Icon } from '../components/Icon';
import { SectionHead } from '../components/SectionHead';
import { useToast } from '../components/Toast';
import { findCity } from '../data/cities';
import type { CaffeineHabit } from '../engine/planEngine';

const CAFFEINE_OPTIONS: [CaffeineHabit, string][] = [
  ['none', 'None'],
  ['one', '1 cup'],
  ['two_three', '2-3 cups'],
  ['lots', 'Lots'],
];

export function Profile() {
  const { prefs, updatePrefs, resetDemo, clearAll, clearTrip, activeTrip, trips, checkins, recovery, customCities, addCustomCity } =
    useStore();
  const { push } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  const [bh, bm] = [Math.floor(prefs.bedtime / 60), prefs.bedtime % 60];
  const [wh, wm] = [Math.floor(prefs.wake / 60), prefs.wake % 60];
  const fmtTimeVal = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return (
    <div className="screen" style={{ maxWidth: 720 }}>
      <SectionHead icon="note" eyebrow="You" title="Profile" />

      <div className="card pad" style={{ marginBottom: 24 }}>
        <div className="field" style={{ marginBottom: 24, maxWidth: 320 }}>
          <CitySearch
            label="Home city"
            value={findCity(prefs.homeCityId, customCities) ?? null}
            cities={customCities}
            onPick={(c) => {
              if (c?.custom) addCustomCity(c);
              updatePrefs({ homeCityId: c?.id ?? '' });
            }}
            placeholder="Search your home city"
          />
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="p-bed">Usual bedtime</label>
            <input
              id="p-bed"
              type="time"
              className="input mono"
              value={fmtTimeVal(bh, bm)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                updatePrefs({ bedtime: h * 60 + m });
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="p-wake">Usual wake time</label>
            <input
              id="p-wake"
              type="time"
              className="input mono"
              value={fmtTimeVal(wh, wm)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                updatePrefs({ wake: h * 60 + m });
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>
            Caffeine habit
          </span>
          <div className="segmented" role="group" aria-label="Caffeine habit">
            {CAFFEINE_OPTIONS.map(([v, label]) => (
              <button key={v} className={prefs.caffeine === v ? 'on' : ''} onClick={() => updatePrefs({ caffeine: v })} aria-pressed={prefs.caffeine === v}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card pad" style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Preferences</div>
        <div className="pref-row">
          <div>
            <div className="pr-label">24-hour clock</div>
            <div className="pr-sub">Show times as 19:30 instead of 7:30 PM.</div>
          </div>
          <button
            className={`switch ${!prefs.hour12 ? 'on' : ''}`}
            role="switch"
            aria-checked={!prefs.hour12}
            aria-label="Use 24-hour clock"
            onClick={() => updatePrefs({ hour12: !prefs.hour12 })}
          />
        </div>
        <div className="pref-row">
          <div>
            <div className="pr-label">Gentle reminders</div>
            <div className="pr-sub">Show upcoming steps as in-app messages while the app is open.</div>
          </div>
          <button
            className={`switch ${prefs.notifications ? 'on' : ''}`}
            role="switch"
            aria-checked={prefs.notifications}
            aria-label="Gentle reminders"
            onClick={() => updatePrefs({ notifications: !prefs.notifications })}
          />
        </div>
      </div>

      <div className="card pad" style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>How Jetwell works</div>
        <div className="explainer">
          <p>Jet lag is a timing problem. Your body clock runs on light, meals and sleep. Cross a few zones and it is out of step.</p>
          <p>We plan three phases around your flight: before, in the air, after. Each step says what to do, when, and why, based on light, sleep timing and caffeine.</p>
          <p>General guidance only. We never diagnose or suggest medication. For sleep aids, check with a pharmacist or doctor.</p>
        </div>
      </div>

      <div className="card pad" style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Your data</div>
        <p className="small muted" style={{ marginBottom: 18 }}>
          {trips.length} trip{trips.length === 1 ? '' : 's'} · {checkins.length} check-in
          {checkins.length === 1 ? '' : 's'} · {recovery.length} recovery score{recovery.length === 1 ? '' : 's'}. All
          stored only in this browser.
        </p>
        <div className="row gap-12" style={{ flexWrap: 'wrap' }}>
          {activeTrip && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const name = activeTrip.label ?? `${activeTrip.originCity} to ${activeTrip.destCity}`;
                clearTrip(activeTrip.id);
                push({ title: 'Trip cleared', body: `${name} and its schedule were removed.`, icon: 'trash' });
              }}
            >
              <Icon name="close" size={15} /> Clear my trip
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              resetDemo();
              push({ title: 'Demo data restored', body: 'Trips and preferences reset to the sample set.', icon: 'refresh' });
            }}
          >
            <Icon name="refresh" size={15} /> Reset demo data
          </button>
          {!confirmClear ? (
            <button className="btn btn-ghost btn-sm danger" onClick={() => setConfirmClear(true)}>
              <Icon name="trash" size={15} /> Clear everything
            </button>
          ) : (
            <span className="row gap-8">
              <span className="small">Sure?</span>
              <button
                className="btn btn-ghost btn-sm danger"
                onClick={() => {
                  clearAll();
                  setConfirmClear(false);
                }}
              >
                Yes, clear
              </button>
              <button className="btn-quiet" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </span>
          )}
        </div>
      </div>

      <p className="footer-note">
        Jetwell offers general wellness guidance and is not a medical device or diagnostic tool. People with sleep
        disorders, who are pregnant, or with health conditions that affect sleep should check with a professional
        before changing routines.
      </p>
    </div>
  );
}

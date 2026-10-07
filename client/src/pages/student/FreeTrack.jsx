import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { getLocale, useT } from '../../i18n.jsx';
import { Chips, ErrorMessage } from '../../components/ui.jsx';

// Carte chargée à la demande (Leaflet) : seulement dans l'onglet des parcours.
const MapView = lazy(() => import('../../components/MapView.jsx'));

const TABS = ['journey', 'guide', 'routes', 'roadbook'];
const ROUTE_COLORS = { ville: '#16a34a', mixte: '#d97706', rapide: '#2563eb' };
const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : '';
const formatNumber = (n) => new Intl.NumberFormat(getLocale()).format(n);

export default function FreeTrack() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'journey';
  const [state, setState] = useState(null);
  const [rules, setRules] = useState(null);
  const [centers, setCenters] = useState([]);
  const [entries, setEntries] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [me, book] = await Promise.all([api('/free-track/me'), api('/free-track/roadbook')]);
      setState(me);
      setEntries(book.entries);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    api('/free-track/rules', { auth: false }).then(setRules).catch((err) => setError(err.message));
    api('/exam-centers', { auth: false })
      .then((d) => setCenters(d.centers))
      .catch(() => {});
  }, [load]);

  const setTab = (id) => setParams(id === 'journey' ? {} : { tab: id }, { replace: true });

  const save = async (changes) => {
    try {
      setState(await api('/free-track/me', { method: 'PUT', body: changes }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // « J'ai fait ce parcours » : ouvre le carnet de bord prérempli.
  const logRoute = (route) => {
    setPrefill({
      routeId: route.id,
      distanceKm: String(route.distanceKm),
      durationMin: String(route.minutes),
      conditions: ['examen', route.type === 'ville' ? 'ville' : route.type === 'mixte' ? 'campagne' : 'autoroute'],
    });
    setTab('roadbook');
  };

  if (!state || !rules) {
    return (
      <div className="page">
        <ErrorMessage error={error} />
        {!error && <p className="muted">{t('common.loading')}</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{t('freeTrack.title')}</h1>
      <p className="muted small">{t('freeTrack.intro')}</p>
      <div className="chips chips-scroll" role="tablist">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`chip ${tab === id ? 'chip-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {t(`freeTrack.tab_${id}`)}
          </button>
        ))}
      </div>
      <ErrorMessage error={error} />

      {tab === 'journey' && <JourneyTab state={state} rules={rules} centers={centers} onSave={save} />}
      {tab === 'guide' && <GuideTab rules={rules} region={state.region} />}
      {tab === 'routes' && (
        <RoutesTab
          centers={centers}
          centerId={params.get('center') ?? state.profile.examCenterId}
          region={state.region}
          practised={state.totals.routes}
          onPickCenter={(id) => save({ examCenterId: id })}
          onLog={logRoute}
        />
      )}
      {tab === 'roadbook' && (
        <RoadbookTab
          state={state}
          rules={rules}
          entries={entries ?? []}
          prefill={prefill}
          onPrefillUsed={() => setPrefill(null)}
          onChange={load}
        />
      )}
    </div>
  );
}

function JourneyTab({ state, rules, centers, onSave }) {
  const t = useT();
  const { profile } = state;
  const [guides, setGuides] = useState([profile.guides[0] ?? '', profile.guides[1] ?? '']);
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState(today());
  const regionCenters = centers.filter((c) => !state.region || c.region === state.region);
  const DATE_FIELDS = { provisional: 'provisionalAt', guide: 'guideSessionAt', exam: 'examDate', license: 'licenseAt' };
  const STEP_LINKS = {
    theory: { to: '/theorie', label: 'freeTrack.goTheory' },
    roadbook: { to: '/libre?tab=roadbook', label: 'freeTrack.goRoadbook' },
    routes: { to: '/libre?tab=routes', label: 'freeTrack.goRoutes' },
    checkLesson: { to: '/reserver?category=B', label: 'freeTrack.goCheckLesson' },
  };

  return (
    <>
      <div className="card">
        <strong>{t('freeTrack.regionQuestion')}</strong>
        <Chips
          options={rules.regions.map((r) => ({ value: r.id, label: r.title }))}
          value={state.region ?? ''}
          onChange={(region) => onSave({ region })}
        />
        <label className="label">
          {t('freeTrack.examCenter')}
          <select value={profile.examCenterId ?? ''} onChange={(e) => onSave({ examCenterId: e.target.value || null })}>
            <option value="">{t('freeTrack.chooseCenter')}</option>
            {regionCenters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.city}
              </option>
            ))}
          </select>
        </label>
        <form
          className="form compact"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ guides: guides.map((g) => g.trim()).filter(Boolean) });
          }}
        >
          <span className="label">{t('freeTrack.guides', { max: rules.common.maxGuides })}</span>
          <div className="row">
            {[0, 1].map((i) => (
              <input
                key={i}
                className="grow"
                maxLength={60}
                placeholder={t('freeTrack.guidePlaceholder', { n: i + 1 })}
                value={guides[i]}
                onChange={(e) => setGuides(guides.map((g, j) => (j === i ? e.target.value : g)))}
              />
            ))}
          </div>
          <button className="btn btn-secondary">{t('freeTrack.saveGuides')}</button>
        </form>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{state.progress} %</span>
          <span className="small muted">{t('freeTrack.progress')}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatNumber(state.totals.km)}</span>
          <span className="small muted">{t('freeTrack.kmOf', { target: formatNumber(state.kmTarget) })}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{state.eligibleFrom ? formatDate(state.eligibleFrom) : '—'}</span>
          <span className="small muted">{t('freeTrack.eligibleFrom')}</span>
        </div>
      </div>

      {state.nextStep?.advice && (
        <div className="card next-step">
          <strong>{t('freeTrack.nextStep')}</strong>
          <span className="small">{state.nextStep.advice}</span>
        </div>
      )}

      {!state.allRoutes && (
        <div className="card pack-promo">
          <strong>{t('freeTrack.promoTitle')}</strong>
          <span className="small">{t('freeTrack.promoText')}</span>
          <Link className="btn btn-primary" to="/pack">
            {t('freeTrack.promoCta')}
          </Link>
        </div>
      )}

      <h2 className="section-title">{t('freeTrack.stepsTitle')}</h2>
      <ol className="journey">
        {state.steps.map((step) => (
          <li
            key={step.id}
            className={`journey-step ${step.done ? 'done' : ''} ${state.nextStep?.id === step.id ? 'current' : ''}`}
          >
            <span className="journey-dot" aria-hidden="true">
              {step.done ? '✓' : ''}
            </span>
            <div className="grow">
              <strong>{step.label}</strong>
              {step.detail && <div className="small muted">{step.detail}</div>}
              {step.progress != null && (
                <div className="progress">
                  <div style={{ width: `${step.progress * 100}%` }} />
                </div>
              )}
              {step.date && <div className="small muted">{formatDate(step.date)}</div>}
              {STEP_LINKS[step.id] && !step.done && (
                <Link className="small" to={STEP_LINKS[step.id].to}>
                  {t(STEP_LINKS[step.id].label)}
                </Link>
              )}
              {DATE_FIELDS[step.id] && editing !== step.id && (
                <button
                  type="button"
                  className="link-button small"
                  onClick={() => {
                    setDate(step.date ?? today());
                    setEditing(step.id);
                  }}
                >
                  {step.done ? t('freeTrack.editDate') : t('freeTrack.declareDate')}
                </button>
              )}
              {editing === step.id && (
                <form
                  className="row declare"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await onSave({ [DATE_FIELDS[step.id]]: date });
                    setEditing(null);
                  }}
                >
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  <button className="btn btn-primary">OK</button>
                  {step.done && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={async () => {
                        await onSave({ [DATE_FIELDS[step.id]]: null });
                        setEditing(null);
                      }}
                    >
                      {t('freeTrack.clearDate')}
                    </button>
                  )}
                </form>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function GuideTab({ rules, region }) {
  const t = useT();
  const yes = t('freeTrack.yes');
  const no = t('freeTrack.no');
  return (
    <>
      <div className="card">
        <strong>{t('freeTrack.whatIsTitle')}</strong>
        <p className="small">{t('freeTrack.whatIsText')}</p>
      </div>

      <h2 className="section-title">{t('freeTrack.commonRules')}</h2>
      <ul className="rule-list">
        {rules.common.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2 className="section-title">{t('freeTrack.compareTitle')}</h2>
      <div className="table-scroll">
        <table className="compare">
          <thead>
            <tr>
              <th />
              {rules.regions.map((r) => (
                <th key={r.id} className={r.id === region ? 'active' : ''}>
                  {r.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>{t('freeTrack.rowMinMonths')}</th>
              {rules.regions.map((r) => (
                <td key={r.id}>
                  {t('freeTrack.months', { count: r.minMonths })}
                  {r.minMonthsWithLessons ? ` (${t('freeTrack.withLessons', { months: r.minMonthsWithLessons, hours: r.lessonHoursForShorterWait })})` : ''}
                </td>
              ))}
            </tr>
            <tr>
              <th>{t('freeTrack.rowGuideTraining')}</th>
              {rules.regions.map((r) => (
                <td key={r.id}>{r.guideTraining.required ? t('freeTrack.hoursRequired', { hours: r.guideTraining.hours }) : t('freeTrack.recommended')}</td>
              ))}
            </tr>
            <tr>
              <th>{t('freeTrack.rowRoadbook')}</th>
              {rules.regions.map((r) => (
                <td key={r.id}>
                  {r.roadbookRequired ? yes : t('freeTrack.recommended')} · {formatNumber(r.kmTarget)} km
                </td>
              ))}
            </tr>
            <tr>
              <th>{t('freeTrack.rowNightBan')}</th>
              {rules.regions.map((r) => (
                <td key={r.id}>{r.nightBan ? t('freeTrack.nightBanYes') : no}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {rules.regions
        .filter((r) => !region || r.id === region)
        .map((r) => (
          <details key={r.id} className="card rule-region" open={r.id === region}>
            <summary>
              <strong>{r.title}</strong>
            </summary>
            <ul className="rule-list">
              {r.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="small muted">{t('freeTrack.sources')}</p>
            <ul className="small">
              {r.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}

      <h2 className="section-title">{t('freeTrack.examDayTitle')}</h2>
      <ul className="rule-list">
        {rules.examTips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <p className="small muted">{t('freeTrack.disclaimer', { date: rules.checkedAt })}</p>
    </>
  );
}

function RoutesTab({ centers, centerId, region, practised, onPickCenter, onLog }) {
  const t = useT();
  const [selected, setSelected] = useState(centerId ?? '');
  const [data, setData] = useState(null);
  const [active, setActive] = useState(null);
  const [error, setError] = useState('');
  const center = centers.find((c) => c.id === selected);
  const options = centers.filter((c) => !region || c.region === region);

  useEffect(() => {
    if (!selected) return;
    setData(null);
    api(`/free-track/routes/${selected}`)
      .then((d) => {
        setData(d);
        setActive(d.routes[0]?.id ?? null);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [selected]);

  const paths = useMemo(
    () =>
      (data?.routes ?? [])
        .filter((r) => r.waypoints.length)
        .map((r) => ({
          id: r.id,
          color: ROUTE_COLORS[r.type],
          active: r.id === active,
          points: [r.start, ...r.waypoints, r.start],
        })),
    [data, active],
  );

  return (
    <>
      <p className="muted small">{t('freeTrack.routesIntro')}</p>
      <label className="label">
        {t('freeTrack.examCenter')}
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            if (e.target.value) onPickCenter(e.target.value);
          }}
        >
          <option value="">{t('freeTrack.chooseCenter')}</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.city}
            </option>
          ))}
        </select>
      </label>
      <ErrorMessage error={error} />

      {center && data && (
        <>
          <Suspense fallback={<div className="map-wrap muted">{t('common.loading')}</div>}>
            <MapView center={center} examCenters={[center]} selectedCenterId={center.id} paths={paths} zoom={12} height="36vh" />
          </Suspense>
          <p className="small muted">{t('freeTrack.mapNote')}</p>
          {data.routes.map((r) => (
            <div
              key={r.id}
              className={`card route-card ${r.id === active ? 'route-active' : ''}`}
              onClick={() => !r.locked && setActive(r.id)}
            >
              <div className="row-between">
                <strong>
                  <span className="route-swatch" style={{ background: ROUTE_COLORS[r.type] }} aria-hidden="true" /> {r.name}
                </strong>
                <span className="small muted">
                  ≈ {r.distanceKm} km · {r.minutes} min
                </span>
              </div>
              <p className="small">{r.summary}</p>
              {practised.includes(r.id) && <span className="badge badge-completed">{t('freeTrack.practised')}</span>}
              {r.locked ? (
                <div className="locked small">
                  🔒 {t('freeTrack.lockedRoute')}{' '}
                  <Link to="/pack">{t('freeTrack.unlock')}</Link>
                </div>
              ) : (
                <>
                  <ul className="rule-list small">
                    {r.focus.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <div className="row wrap">
                    <a className="btn btn-primary" href={r.mapsUrl} target="_blank" rel="noreferrer">
                      {t('freeTrack.openMaps')}
                    </a>
                    <button type="button" className="btn btn-secondary" onClick={() => onLog(r)}>
                      {t('freeTrack.logRoute')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          <p className="small muted">{t('freeTrack.routesDisclaimer')}</p>
        </>
      )}
      {!selected && <p className="empty">{t('freeTrack.pickCenterFirst')}</p>}
    </>
  );
}

const CONDITION_ICONS = { ville: '🏙️', campagne: '🌾', autoroute: '🛣️', nuit: '🌙', pluie: '🌧️', trafic: '🚦', manoeuvres: '🅿️', examen: '🏁' };

function RoadbookTab({ state, rules, entries, prefill, onPrefillUsed, onChange }) {
  const t = useT();
  const blank = { date: today(), durationMin: '60', distanceKm: '', conditions: [], routeId: '', guideName: state.profile.guides[0] ?? '', notes: '' };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!prefill) return;
    setForm((f) => ({ ...f, ...prefill }));
    onPrefillUsed();
  }, [prefill, onPrefillUsed]);

  const conditionLabel = Object.fromEntries(rules.conditions.map((c) => [c.id, c.label]));
  const toggle = (id) =>
    setForm((f) => ({ ...f, conditions: f.conditions.includes(id) ? f.conditions.filter((c) => c !== id) : [...f.conditions, id] }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/free-track/roadbook', {
        method: 'POST',
        body: { ...form, durationMin: Number(form.durationMin), distanceKm: Number(form.distanceKm.replace(',', '.')), routeId: form.routeId || null },
      });
      setForm({ ...blank, guideName: form.guideName });
      setError('');
      await onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t('freeTrack.confirmDelete'))) return;
    try {
      await api(`/free-track/roadbook/${id}`, { method: 'DELETE' });
      await onChange();
    } catch (err) {
      setError(err.message);
    }
  };

  // Export CSV (tableur) du carnet de bord.
  const exportCsv = () => {
    const header = [t('freeTrack.colDate'), t('freeTrack.colDuration'), 'km', t('freeTrack.colConditions'), t('freeTrack.colGuide'), t('freeTrack.colNotes')];
    const rows = entries.map((e) => [e.date, e.durationMin, e.distanceKm, e.conditions.map((c) => conditionLabel[c]).join(' / '), e.guideName, e.notes]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'autoschub-carnet-de-bord.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const hours = Math.round((state.totals.minutes / 60) * 10) / 10;
  const rare = ['nuit', 'pluie', 'autoroute'].filter((c) => !state.totals.byCondition[c]);

  return (
    <>
      <div className="stats">
        <div className="stat">
          <span className="stat-value">{formatNumber(state.totals.km)} km</span>
          <span className="small muted">{t('freeTrack.kmOf', { target: formatNumber(state.kmTarget) })}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatNumber(hours)} h</span>
          <span className="small muted">{t('freeTrack.drivingTime')}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{state.totals.entries}</span>
          <span className="small muted">{t('freeTrack.drives', { count: state.totals.entries })}</span>
        </div>
      </div>
      <div className="progress">
        <div style={{ width: `${Math.min(100, (state.totals.km / state.kmTarget) * 100)}%` }} />
      </div>
      {state.totals.entries > 0 && rare.length > 0 && (
        <p className="notice small">{t('freeTrack.varietyTip', { list: rare.map((c) => conditionLabel[c]).join(', ') })}</p>
      )}

      <form className="form card no-print" onSubmit={submit}>
        <strong>{t('freeTrack.newDrive')}</strong>
        <div className="row">
          <label className="label grow">
            {t('freeTrack.colDate')}
            <input type="date" max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </label>
          <label className="label grow">
            {t('freeTrack.durationMin')}
            <input type="number" min="5" max="720" inputMode="numeric" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} required />
          </label>
          <label className="label grow">
            km
            <input inputMode="decimal" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} required placeholder="25" />
          </label>
        </div>
        <span className="label">{t('freeTrack.colConditions')}</span>
        <div className="chips" role="group">
          {rules.conditions.map((c) => (
            <button key={c.id} type="button" className={`chip ${form.conditions.includes(c.id) ? 'chip-active' : ''}`} onClick={() => toggle(c.id)}>
              {CONDITION_ICONS[c.id]} {c.label}
            </button>
          ))}
        </div>
        <label className="label">
          {t('freeTrack.colGuide')}
          <input maxLength={60} list="guides" value={form.guideName} onChange={(e) => setForm({ ...form, guideName: e.target.value })} />
          <datalist id="guides">
            {state.profile.guides.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </label>
        {form.routeId && (
          <p className="small muted">
            🏁 {t('freeTrack.linkedRoute')} <button type="button" className="link-button small" onClick={() => setForm({ ...form, routeId: '' })}>✕</button>
          </p>
        )}
        <label className="label">
          {t('freeTrack.colNotes')}
          <textarea rows={2} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('freeTrack.notesPlaceholder')} />
        </label>
        <ErrorMessage error={error} />
        <button className="btn btn-primary" disabled={busy}>
          {t('freeTrack.addDrive')}
        </button>
      </form>

      <div className="row-between">
        <h2 className="section-title">{t('freeTrack.history')}</h2>
        {entries.length > 0 && (
          <div className="row no-print">
            <button type="button" className="btn btn-secondary small" onClick={exportCsv}>
              CSV
            </button>
            <button type="button" className="btn btn-secondary small" onClick={() => window.print()}>
              {t('freeTrack.print')}
            </button>
          </div>
        )}
      </div>
      {!entries.length && <p className="empty">{t('freeTrack.noDrives')}</p>}
      <ul className="roadbook">
        {entries.map((e) => (
          <li key={e.id} className="card roadbook-entry">
            <div className="row-between">
              <strong>{formatDate(e.date)}</strong>
              <span className="small">
                {formatNumber(e.distanceKm)} km · {e.durationMin} min
              </span>
            </div>
            {e.conditions.length > 0 && (
              <div className="small">{e.conditions.map((c) => `${CONDITION_ICONS[c] ?? ''} ${conditionLabel[c] ?? c}`).join(' · ')}</div>
            )}
            {(e.guideName || e.notes) && (
              <div className="small muted">
                {e.guideName && t('freeTrack.withGuide', { name: e.guideName })}
                {e.guideName && e.notes ? ' — ' : ''}
                {e.notes}
              </div>
            )}
            <button type="button" className="link-button small no-print" onClick={() => remove(e.id)}>
              {t('freeTrack.delete')}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

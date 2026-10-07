import { useEffect, useState } from 'react';
import { api, LANGUAGE_LABELS } from '../../api.js';
import { CITIES } from '../../cities.js';
import { Chips, ErrorMessage, MultiChips } from '../../components/ui.jsx';
import { useAuth } from '../../auth.jsx';
import AvailabilityEditor from '../../components/AvailabilityEditor.jsx';
import { LanguageSwitcher, useT } from '../../i18n.jsx';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label }));
// Valeurs envoyées au serveur ; libellés traduits au rendu.
const TRANSMISSIONS = [
  { value: 'manuelle', key: 'transmission_manual' },
  { value: 'automatique', key: 'transmission_automatic' },
  { value: 'les deux', key: 'transmission_both' },
];

export default function InstructorProfile() {
  const t = useT();
  const { user, logout } = useAuth();
  const [form, setForm] = useState(null);
  const [permits, setPermits] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/permits', { auth: false }).then((d) => setPermits(d.permits)).catch(() => {});
    api('/instructors/me/profile')
      .then(({ instructor }) => setForm(instructor))
      .catch((err) => setError(err.message));
  }, []);

  if (!form) return <div className="page">{error ? <ErrorMessage error={error} /> : t('common.loading')}</div>;

  const field = (name) => ({ value: form[name] ?? '', onChange: (e) => setForm({ ...form, [name]: e.target.value }) });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      const { instructor } = await api('/instructors/me/profile', {
        method: 'PATCH',
        body: {
          bio: form.bio,
          vehicle: form.vehicle,
          schoolName: form.schoolName,
          hourlyRate: Number(form.hourlyRate),
          categories: form.categories,
          languages: form.languages,
          transmission: form.transmission,
          lat: form.lat,
          lng: form.lng,
        },
      });
      setForm(instructor);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <h1>{t('instructorProfile.title')}</h1>
      <p className="muted">
        {user.firstName} {user.lastName} · {user.email} · {t('instructorProfile.approval', { number: form.approvalNumber })}
      </p>
      <form className="form" onSubmit={save}>
        <div className="label">{t('instructorProfile.categories')}</div>
        <MultiChips
          options={permits.map((p) => ({ value: p.code, label: p.code }))}
          values={form.categories}
          onChange={(categories) => setForm({ ...form, categories })}
        />
        <div className="label">{t('instructorProfile.languagesSpoken')}</div>
        <MultiChips
          options={LANGUAGE_OPTIONS}
          values={form.languages}
          onChange={(languages) => setForm({ ...form, languages })}
        />
        <div className="label">{t('instructorProfile.gearbox')}</div>
        <Chips
          options={TRANSMISSIONS.map((o) => ({ value: o.value, label: t(`instructorProfile.${o.key}`) }))}
          value={form.transmission}
          onChange={(transmission) => setForm({ ...form, transmission })}
        />
        <label>
          {t('instructorProfile.workArea')}
          <select
            value=""
            onChange={(e) => {
              const city = CITIES.find((c) => c.name === e.target.value);
              if (city) setForm({ ...form, lat: city.lat, lng: city.lng });
            }}
          >
            <option value="">
              {t('instructorProfile.currentPosition', { lat: form.lat?.toFixed(3), lng: form.lng?.toFixed(3) })}
            </option>
            {CITIES.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          {t('instructorProfile.school')}
          <input {...field('schoolName')} />
        </label>
        <label>
          {t('instructorProfile.vehicles')}
          <input {...field('vehicle')} />
        </label>
        <label>
          {t('instructorProfile.hourlyRate')}
          <input type="number" min={20} max={250} {...field('hourlyRate')} />
        </label>
        <label>
          {t('instructorProfile.bio')}
          <textarea rows={4} {...field('bio')} />
        </label>
        <ErrorMessage error={error} />
        {saved && <p className="success">{t('instructorProfile.saved')}</p>}
        <button className="btn btn-primary">{t('common.save')}</button>
      </form>
      <AvailabilityEditor />
      <section className="card">
        <h2 className="section-title">{t('instructorProfile.appLanguage')}</h2>
        <p className="muted small">{t('instructorProfile.appLanguageHint')}</p>
        <LanguageSwitcher />
      </section>
      <button type="button" className="btn btn-danger btn-block logout" onClick={logout}>
        {t('instructorProfile.logout')}
      </button>
    </div>
  );
}

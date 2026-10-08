import '../../styles/instructor.css';
import { useEffect, useState } from 'react';
import { api, formatPrice, LANGUAGE_LABELS } from '../../api.js';
import { CITIES } from '../../cities.js';
import { Chips, ErrorMessage, MultiChips, PageHeader, SectionHead } from '../../components/ui.jsx';
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
  const [form, setFormState] = useState(null);
  const [permits, setPermits] = useState([]);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/permits', { auth: false }).then((d) => setPermits(d.permits)).catch(() => {});
    api('/instructors/me/profile')
      .then(({ instructor }) => setFormState(instructor))
      .catch((err) => setError(err.message));
  }, []);

  const header = (
    <PageHeader
      eyebrow={t('instructorProfile.eyebrow')}
      title={t('instructorProfile.title')}
      subtitle={t('instructorProfile.subtitle')}
      action={
        <span className="ins-avatar" aria-hidden="true">
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </span>
      }
    />
  );

  if (!form) {
    return (
      <div className="page">
        {header}
        <ErrorMessage error={error} />
        {!error && (
          <>
            <div className="skeleton" style={{ minHeight: 120 }} />
            <div className="skeleton" style={{ minHeight: 260 }} />
          </>
        )}
      </div>
    );
  }

  const setForm = (next) => {
    setFormState(next);
    setDirty(true);
    setSaved(false);
  };
  const field = (name) => ({ value: form[name] ?? '', onChange: (e) => setForm({ ...form, [name]: e.target.value }) });
  const transmissionLabel = (value) => {
    const opt = TRANSMISSIONS.find((o) => o.value === value);
    return opt ? t(`instructorProfile.${opt.key}`) : '';
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
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
      setFormState(instructor);
      setDirty(false);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page ins-profile">
      {header}

      <div className="card ins-identity">
        <div className="grow">
          <strong>
            {user.firstName} {user.lastName}
          </strong>
          <small>{user.email}</small>
        </div>
        <span className="ins-approval">{t('instructorProfile.approval', { number: form.approvalNumber })}</span>
      </div>

      <form className="form ins-form" onSubmit={save}>
        {/* 1 · Profil public */}
        <SectionHead step={1} title={t('instructorProfile.s1Title')} subtitle={t('instructorProfile.s1Subtitle')} />
        <div className="card ins-preview" aria-label={t('instructorProfile.previewLabel')}>
          <span className="ins-preview-kicker">{t('instructorProfile.previewLabel')}</span>
          <div className="ins-preview-row">
            <span className="ins-avatar small" aria-hidden="true">
              {user.firstName?.[0]}
            </span>
            <span className="grow">
              <strong>
                {user.firstName} {user.lastName?.[0]}.
              </strong>
              <small>
                {[form.schoolName, transmissionLabel(form.transmission), (form.languages ?? []).map((l) => l.toUpperCase()).join(' · ')]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </span>
            <strong className="ins-preview-price">
              {Number(form.hourlyRate) ? t('instructorProfile.perHour', { price: formatPrice(Number(form.hourlyRate)) }) : '—'}
            </strong>
          </div>
          {form.bio && <p className="ins-preview-bio">“{form.bio}”</p>}
        </div>

        <label>
          {t('instructorProfile.bio')}
          <textarea rows={4} placeholder={t('instructorProfile.bioPlaceholder')} {...field('bio')} />
        </label>
        <div className="label">{t('instructorProfile.languagesSpoken')}</div>
        <MultiChips
          options={LANGUAGE_OPTIONS}
          values={form.languages}
          onChange={(languages) => setForm({ ...form, languages })}
        />
        <label>
          {t('instructorProfile.hourlyRate')}
          <input type="number" min={20} max={250} inputMode="decimal" {...field('hourlyRate')} />
          <small className="ins-hint">{t('instructorProfile.hourlyRateHint')}</small>
        </label>
        <label>
          {t('instructorProfile.school')}
          <input {...field('schoolName')} />
        </label>
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
          <small className="ins-hint">{t('instructorProfile.workAreaHint')}</small>
        </label>

        {/* 2 · Catégories et véhicule */}
        <SectionHead step={2} title={t('instructorProfile.s2Title')} subtitle={t('instructorProfile.s2Subtitle')} />
        <div className="label">{t('instructorProfile.categories')}</div>
        <MultiChips
          options={permits.map((p) => ({ value: p.code, label: p.code }))}
          values={form.categories}
          onChange={(categories) => setForm({ ...form, categories })}
        />
        <div className="label">{t('instructorProfile.gearbox')}</div>
        <Chips
          options={TRANSMISSIONS.map((o) => ({ value: o.value, label: t(`instructorProfile.${o.key}`) }))}
          value={form.transmission}
          onChange={(transmission) => setForm({ ...form, transmission })}
        />
        <label>
          {t('instructorProfile.vehicles')}
          <input placeholder={t('instructorProfile.vehiclePlaceholder')} {...field('vehicle')} />
        </label>

        {/* Barre d'enregistrement collée en bas */}
        <div className={`sticky-cta ins-savebar ${dirty ? 'dirty' : ''}`}>
          <div className="grow" aria-live="polite">
            <strong>
              {dirty ? t('instructorProfile.unsaved') : saved ? t('instructorProfile.saved') : t('instructorProfile.upToDate')}
            </strong>
            <small>{t('instructorProfile.saveHint')}</small>
          </div>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
        <ErrorMessage error={error} />
      </form>

      {/* 3 · Disponibilités */}
      <SectionHead id="disponibilites" step={3} title={t('instructorProfile.s3Title')} subtitle={t('instructorProfile.s3Subtitle')} />
      <AvailabilityEditor />

      {/* 4 · Langue de l'app */}
      <SectionHead step={4} title={t('instructorProfile.s4Title')} subtitle={t('instructorProfile.appLanguageHint')} />
      <div className="card">
        <LanguageSwitcher />
      </div>

      <button type="button" className="btn btn-danger btn-block logout" onClick={logout}>
        {t('instructorProfile.logout')}
      </button>
    </div>
  );
}

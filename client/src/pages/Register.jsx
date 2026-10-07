import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, LANGUAGE_LABELS } from '../api.js';
import { useAuth } from '../auth.jsx';
import { CITIES } from '../cities.js';
import { Chips, ErrorMessage, MultiChips } from '../components/ui.jsx';
import { LanguageSwitcher, useT } from '../i18n.jsx';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label }));
// Valeurs envoyées au serveur (identifiants) → clé de traduction du libellé.
const TRANSMISSIONS = [
  { value: 'manuelle', key: 'register.transmission_manuelle' },
  { value: 'automatique', key: 'register.transmission_automatique' },
  { value: 'les deux', key: 'register.transmission_both' },
];

export default function Register() {
  const t = useT();
  const { register } = useAuth();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'instructor' ? 'instructor' : 'student');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', city: 'Bruxelles' });
  const [instructor, setInstructor] = useState({
    approvalNumber: '',
    schoolName: '',
    categories: ['B'],
    languages: ['fr'],
    transmission: 'manuelle',
    vehicle: '',
    hourlyRate: 55,
    bio: '',
  });
  const [permits, setPermits] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/permits', { auth: false }).then((d) => setPermits(d.permits)).catch(() => {});
  }, []);

  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  });
  const instructorField = (name) => ({
    value: instructor[name],
    onChange: (e) => setInstructor({ ...instructor, [name]: e.target.value }),
  });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const city = CITIES.find((c) => c.name === form.city) ?? CITIES[0];
    try {
      await register({
        role,
        ...form,
        instructor:
          role === 'instructor'
            ? { ...instructor, hourlyRate: Number(instructor.hourlyRate), lat: city.lat, lng: city.lng }
            : undefined,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="row-between">
        <Link to="/" className="back">
          {t('common.back')}
        </Link>
        <LanguageSwitcher />
      </div>
      <h1>{t('register.title')}</h1>
      <Chips
        options={[
          { value: 'student', label: t('register.roleStudent') },
          { value: 'instructor', label: t('register.roleInstructor') },
        ]}
        value={role}
        onChange={setRole}
      />

      <form onSubmit={submit} className="form">
        <div className="row">
          <label>
            {t('register.firstName')}
            <input {...field('firstName')} required autoComplete="given-name" />
          </label>
          <label>
            {t('register.lastName')}
            <input {...field('lastName')} required autoComplete="family-name" />
          </label>
        </div>
        <label>
          {t('register.email')}
          <input type="email" {...field('email')} required autoComplete="email" />
        </label>
        <label>
          {t('register.password')}
          <input type="password" {...field('password')} required minLength={8} autoComplete="new-password" />
        </label>
        <label>
          {t('register.phone')}
          <input type="tel" {...field('phone')} placeholder="+32 4xx xx xx xx" autoComplete="tel" />
        </label>
        <label>
          {t('register.city')}
          <select {...field('city')}>
            {CITIES.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>

        {role === 'instructor' && (
          <fieldset className="fieldset">
            <legend>{t('register.instructorProfile')}</legend>
            <label>
              {t('register.approvalNumber')}
              <input {...instructorField('approvalNumber')} required placeholder={t('register.approvalPlaceholder')} />
            </label>
            <label>
              {t('register.school')}
              <input {...instructorField('schoolName')} />
            </label>
            <div className="label">{t('register.categories')}</div>
            <MultiChips
              options={permits.map((p) => ({ value: p.code, label: p.code }))}
              values={instructor.categories}
              onChange={(categories) => setInstructor({ ...instructor, categories })}
            />
            <div className="label">{t('register.languages')}</div>
            <MultiChips
              options={LANGUAGE_OPTIONS}
              values={instructor.languages}
              onChange={(languages) => setInstructor({ ...instructor, languages })}
            />
            <div className="label">{t('register.transmission')}</div>
            <Chips
              options={TRANSMISSIONS.map((o) => ({ value: o.value, label: t(o.key) }))}
              value={instructor.transmission}
              onChange={(transmission) => setInstructor({ ...instructor, transmission })}
            />
            <label>
              {t('register.vehicle')}
              <input {...instructorField('vehicle')} placeholder={t('register.vehiclePlaceholder')} />
            </label>
            <label>
              {t('register.hourlyRate')}
              <input type="number" min={20} max={250} {...instructorField('hourlyRate')} />
            </label>
            <label>
              {t('register.bio')}
              <textarea rows={3} {...instructorField('bio')} />
            </label>
          </fieldset>
        )}

        <ErrorMessage error={error} />
        <button className="btn btn-primary" disabled={busy}>
          {busy ? t('register.submitting') : t('register.submit')}
        </button>
      </form>
      <p className="muted center">
        {t('register.alreadyRegistered')} <Link to="/connexion">{t('register.login')}</Link>
      </p>
    </div>
  );
}

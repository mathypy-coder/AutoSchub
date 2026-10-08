import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, LANGUAGE_LABELS } from '../api.js';
import { useAuth } from '../auth.jsx';
import { CITIES } from '../cities.js';
import { Chips, ErrorMessage, MultiChips, SectionHead, Stepper } from '../components/ui.jsx';
import { useT } from '../i18n.jsx';
import { AuthTopbar, PasswordField } from './Login.jsx';
import '../styles/welcome.css';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label }));
// Valeurs envoyées au serveur (identifiants) → clé de traduction du libellé.
const TRANSMISSIONS = [
  { value: 'manuelle', key: 'register.transmission_manuelle' },
  { value: 'automatique', key: 'register.transmission_automatique' },
  { value: 'les deux', key: 'register.transmission_both' },
];
const ROLES = [
  { value: 'student', icon: '🎓', key: 'choiceStudent' },
  { value: 'instructor', icon: '🧑‍🏫', key: 'choiceInstructor' },
];

export default function Register() {
  const t = useT();
  const { register } = useAuth();
  const [params] = useSearchParams();
  const roleParam = params.get('role');
  const [role, setRole] = useState(roleParam === 'instructor' ? 'instructor' : 'student');
  // ?role=instructor (ou student) mène directement au formulaire ; sinon on commence par le choix du profil.
  const [step, setStep] = useState(roleParam === 'instructor' || roleParam === 'student' ? 'form' : 'choose');
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
  const titleRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    api('/permits', { auth: false }).then((d) => setPermits(d.permits)).catch(() => {});
  }, []);

  // Changement d'étape : on remonte en haut et on place le focus sur le titre.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    titleRef.current?.focus();
  }, [step]);

  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  });
  const instructorField = (name) => ({
    value: instructor[name],
    onChange: (e) => setInstructor({ ...instructor, [name]: e.target.value }),
  });

  const chooseRole = (value) => {
    setRole(value);
    setError('');
    setStep('form');
  };

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

  const steps = [
    { id: 'role', label: t('register.stepRole') },
    { id: 'account', label: t('register.stepAccount') },
  ];
  const isInstructor = role === 'instructor';

  return (
    <div className="auth">
      <div className="auth-band" aria-hidden="true" />
      <div className="auth-inner">
        {step === 'choose' ? <AuthTopbar /> : <AuthTopbar onBack={() => setStep('choose')} />}

        {step === 'choose' ? (
          <section className="auth-card" aria-labelledby="register-title">
            <Stepper steps={steps} current={0} />
            <span className="wl-eyebrow">{t('register.chooseEyebrow')}</span>
            <h1 id="register-title" ref={titleRef} tabIndex={-1}>
              {t('register.chooseTitle')}
            </h1>
            <p className="auth-sub">{t('register.chooseSubtitle')}</p>
            <div className="auth-roles">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`auth-role ${role === r.value ? 'selected' : ''}`}
                  onClick={() => chooseRole(r.value)}
                >
                  <span className="auth-role-icon" aria-hidden="true">
                    {r.icon}
                  </span>
                  <span className="auth-role-body">
                    <strong>{t(`register.${r.key}_title`)}</strong>
                    <small>{t(`register.${r.key}_text`)}</small>
                    <span className="wl-tag">{t(`register.${r.key}_tag`)}</span>
                  </span>
                  <span className="auth-demo-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="auth-card" aria-labelledby="register-title">
            <Stepper steps={steps} current={1} />
            <div className="auth-form-head">
              <span className="wl-eyebrow">
                {t(isInstructor ? 'register.formEyebrowInstructor' : 'register.formEyebrowStudent')}
              </span>
              <button type="button" className="auth-link-btn" onClick={() => setStep('choose')}>
                {t('register.changeRole')}
              </button>
            </div>
            <h1 id="register-title" ref={titleRef} tabIndex={-1}>
              {t(isInstructor ? 'register.formTitleInstructor' : 'register.formTitleStudent')}
            </h1>
            <p className="auth-sub">
              {t(isInstructor ? 'register.formSubtitleInstructor' : 'register.formSubtitleStudent')}
            </p>

            <form onSubmit={submit} className="auth-form">
              <SectionHead step={1} title={t('register.secIdentity')} subtitle={t('register.secIdentitySub')} />
              <div className="auth-row">
                <div className="auth-field">
                  <label htmlFor="reg-first">{t('register.firstName')}</label>
                  <input id="reg-first" {...field('firstName')} required autoComplete="given-name" />
                </div>
                <div className="auth-field">
                  <label htmlFor="reg-last">{t('register.lastName')}</label>
                  <input id="reg-last" {...field('lastName')} required autoComplete="family-name" />
                </div>
              </div>

              <SectionHead step={2} title={t('register.secLogin')} subtitle={t('register.secLoginSub')} />
              <div className="auth-field">
                <label htmlFor="reg-email">{t('register.email')}</label>
                <input
                  id="reg-email"
                  type="email"
                  {...field('email')}
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder={t('register.emailPlaceholder')}
                />
              </div>
              <PasswordField
                label={t('register.password')}
                hint={t('register.passwordHint')}
                showLabel={t('register.showPassword')}
                hideLabel={t('register.hidePassword')}
                {...field('password')}
                required
                minLength={8}
                autoComplete="new-password"
              />

              <SectionHead
                step={3}
                title={t('register.secContact')}
                subtitle={t(isInstructor ? 'register.secContactSubInstructor' : 'register.secContactSubStudent')}
              />
              <div className="auth-field">
                <label htmlFor="reg-city">{t('register.city')}</label>
                <select id="reg-city" {...field('city')}>
                  {CITIES.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="reg-phone">
                  {t('register.phone')} <span className="auth-optional">({t('register.phoneOptional')})</span>
                </label>
                <input id="reg-phone" type="tel" {...field('phone')} placeholder="+32 4xx xx xx xx" autoComplete="tel" />
              </div>

              {isInstructor && (
                <>
                  <SectionHead step={4} title={t('register.secApproval')} subtitle={t('register.secApprovalSub')} />
                  <div className="auth-field">
                    <label htmlFor="reg-approval">{t('register.approvalNumber')}</label>
                    <input
                      id="reg-approval"
                      {...instructorField('approvalNumber')}
                      required
                      placeholder={t('register.approvalPlaceholder')}
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="reg-school">{t('register.school')}</label>
                    <input id="reg-school" {...instructorField('schoolName')} />
                  </div>

                  <SectionHead step={5} title={t('register.secTeaching')} subtitle={t('register.secTeachingSub')} />
                  <div className="auth-field">
                    <span className="auth-label" id="reg-cats">
                      {t('register.categories')}
                    </span>
                    <div aria-labelledby="reg-cats" role="group">
                      <MultiChips
                        options={permits.map((p) => ({ value: p.code, label: p.code }))}
                        values={instructor.categories}
                        onChange={(categories) => setInstructor({ ...instructor, categories })}
                      />
                    </div>
                  </div>
                  <div className="auth-field">
                    <span className="auth-label" id="reg-langs">
                      {t('register.languages')}
                    </span>
                    <div aria-labelledby="reg-langs" role="group">
                      <MultiChips
                        options={LANGUAGE_OPTIONS}
                        values={instructor.languages}
                        onChange={(languages) => setInstructor({ ...instructor, languages })}
                      />
                    </div>
                  </div>
                  <div className="auth-field">
                    <span className="auth-label" id="reg-gear">
                      {t('register.transmission')}
                    </span>
                    <div aria-labelledby="reg-gear" role="group">
                      <Chips
                        options={TRANSMISSIONS.map((o) => ({ value: o.value, label: t(o.key) }))}
                        value={instructor.transmission}
                        onChange={(transmission) => setInstructor({ ...instructor, transmission })}
                      />
                    </div>
                  </div>
                  <div className="auth-row auth-row-rate">
                    <div className="auth-field">
                      <label htmlFor="reg-vehicle">{t('register.vehicle')}</label>
                      <input
                        id="reg-vehicle"
                        {...instructorField('vehicle')}
                        placeholder={t('register.vehiclePlaceholder')}
                      />
                    </div>
                    <div className="auth-field auth-field-rate">
                      <label htmlFor="reg-rate">{t('register.hourlyRate')}</label>
                      <input
                        id="reg-rate"
                        type="number"
                        inputMode="numeric"
                        min={20}
                        max={250}
                        {...instructorField('hourlyRate')}
                      />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label htmlFor="reg-bio">{t('register.bio')}</label>
                    <textarea
                      id="reg-bio"
                      rows={3}
                      {...instructorField('bio')}
                      placeholder={t('register.bioPlaceholder')}
                    />
                  </div>
                </>
              )}

              <ErrorMessage error={error} />
              <p className="auth-consent">{t('register.consent')}</p>
              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy
                  ? t('register.submitting')
                  : t(isInstructor ? 'register.submitInstructor' : 'register.submit')}
              </button>
            </form>
          </section>
        )}

        <p className="auth-switch">
          {t('register.alreadyRegistered')} <Link to="/connexion">{t('register.login')}</Link>
        </p>
      </div>
    </div>
  );
}

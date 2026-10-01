import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, LANGUAGE_LABELS } from '../api.js';
import { useAuth } from '../auth.jsx';
import { CITIES } from '../cities.js';
import { Chips, ErrorMessage, MultiChips } from '../components/ui.jsx';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label }));
const TRANSMISSIONS = [
  { value: 'manuelle', label: 'Manuelle' },
  { value: 'automatique', label: 'Automatique' },
  { value: 'les deux', label: 'Les deux' },
];

export default function Register() {
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
    api('/permits').then((d) => setPermits(d.permits)).catch(() => {});
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
      <Link to="/" className="back">
        ← Retour
      </Link>
      <h1>Inscription</h1>
      <Chips
        options={[
          { value: 'student', label: '🎓 Je suis élève' },
          { value: 'instructor', label: '🧑‍🏫 Je suis moniteur' },
        ]}
        value={role}
        onChange={setRole}
      />

      <form onSubmit={submit} className="form">
        <div className="row">
          <label>
            Prénom
            <input {...field('firstName')} required autoComplete="given-name" />
          </label>
          <label>
            Nom
            <input {...field('lastName')} required autoComplete="family-name" />
          </label>
        </div>
        <label>
          E-mail
          <input type="email" {...field('email')} required autoComplete="email" />
        </label>
        <label>
          Mot de passe (8 caractères min.)
          <input type="password" {...field('password')} required minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Téléphone
          <input type="tel" {...field('phone')} placeholder="+32 4xx xx xx xx" autoComplete="tel" />
        </label>
        <label>
          Ville
          <select {...field('city')}>
            {CITIES.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>

        {role === 'instructor' && (
          <fieldset className="fieldset">
            <legend>Profil moniteur</legend>
            <label>
              Numéro d’agrément / brevet de moniteur
              <input {...instructorField('approvalNumber')} required placeholder="ex. AGR-123456" />
            </label>
            <label>
              Auto-école (ou « Indépendant »)
              <input {...instructorField('schoolName')} />
            </label>
            <div className="label">Catégories enseignées</div>
            <MultiChips
              options={permits.map((p) => ({ value: p.code, label: p.code }))}
              values={instructor.categories}
              onChange={(categories) => setInstructor({ ...instructor, categories })}
            />
            <div className="label">Langues</div>
            <MultiChips
              options={LANGUAGE_OPTIONS}
              values={instructor.languages}
              onChange={(languages) => setInstructor({ ...instructor, languages })}
            />
            <div className="label">Boîte de vitesses</div>
            <Chips
              options={TRANSMISSIONS}
              value={instructor.transmission}
              onChange={(transmission) => setInstructor({ ...instructor, transmission })}
            />
            <label>
              Véhicule(s)
              <input {...instructorField('vehicle')} placeholder="ex. VW Polo double commande" />
            </label>
            <label>
              Tarif horaire (€)
              <input type="number" min={20} max={250} {...instructorField('hourlyRate')} />
            </label>
            <label>
              Présentation
              <textarea rows={3} {...instructorField('bio')} />
            </label>
          </fieldset>
        )}

        <ErrorMessage error={error} />
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="muted center">
        Déjà inscrit ? <Link to="/connexion">Connexion</Link>
      </p>
    </div>
  );
}

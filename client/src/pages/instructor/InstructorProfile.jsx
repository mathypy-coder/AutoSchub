import { useEffect, useState } from 'react';
import { api, LANGUAGE_LABELS } from '../../api.js';
import { CITIES } from '../../cities.js';
import { Chips, ErrorMessage, MultiChips } from '../../components/ui.jsx';
import { useAuth } from '../../auth.jsx';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label }));
const TRANSMISSIONS = [
  { value: 'manuelle', label: 'Manuelle' },
  { value: 'automatique', label: 'Automatique' },
  { value: 'les deux', label: 'Les deux' },
];

export default function InstructorProfile() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState(null);
  const [permits, setPermits] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/permits').then((d) => setPermits(d.permits)).catch(() => {});
    api('/instructors/me/profile')
      .then(({ instructor }) => setForm(instructor))
      .catch((err) => setError(err.message));
  }, []);

  if (!form) return <div className="page">{error ? <ErrorMessage error={error} /> : 'Chargement…'}</div>;

  const field = (name) => ({ value: form[name] ?? '', onChange: (e) => setForm({ ...form, [name]: e.target.value }) });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
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
      setMessage('Profil enregistré ✔');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <h1>Mon profil moniteur</h1>
      <p className="muted">
        {user.firstName} {user.lastName} · {user.email} · agrément {form.approvalNumber}
      </p>
      <form className="form" onSubmit={save}>
        <div className="label">Catégories enseignées</div>
        <MultiChips
          options={permits.map((p) => ({ value: p.code, label: p.code }))}
          values={form.categories}
          onChange={(categories) => setForm({ ...form, categories })}
        />
        <div className="label">Langues</div>
        <MultiChips
          options={LANGUAGE_OPTIONS}
          values={form.languages}
          onChange={(languages) => setForm({ ...form, languages })}
        />
        <div className="label">Boîte de vitesses</div>
        <Chips options={TRANSMISSIONS} value={form.transmission} onChange={(transmission) => setForm({ ...form, transmission })} />
        <label>
          Zone de travail
          <select
            value=""
            onChange={(e) => {
              const city = CITIES.find((c) => c.name === e.target.value);
              if (city) setForm({ ...form, lat: city.lat, lng: city.lng });
            }}
          >
            <option value="">Position actuelle ({form.lat?.toFixed(3)}, {form.lng?.toFixed(3)}) — changer…</option>
            {CITIES.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Auto-école
          <input {...field('schoolName')} />
        </label>
        <label>
          Véhicule(s)
          <input {...field('vehicle')} />
        </label>
        <label>
          Tarif horaire (€)
          <input type="number" min={20} max={250} {...field('hourlyRate')} />
        </label>
        <label>
          Présentation
          <textarea rows={4} {...field('bio')} />
        </label>
        <ErrorMessage error={error} />
        {message && <p className="success">{message}</p>}
        <button className="btn btn-primary">Enregistrer</button>
      </form>
      <button type="button" className="btn btn-danger btn-block logout" onClick={logout}>
        Se déconnecter
      </button>
    </div>
  );
}

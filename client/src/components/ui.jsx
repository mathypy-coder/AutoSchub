import { statusLabel } from '../api.js';
import { translate } from '../i18n.jsx';

export function Stars({ value, count }) {
  if (value == null) return <span className="muted">{translate('common.new')}</span>;
  return (
    <span className="stars">
      ★ {value.toFixed(1)}
      {count != null && <span className="muted"> ({count})</span>}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>;
}

export function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <p className="error" role="alert">
      {error}
    </p>
  );
}

export function Chips({ options, value, onChange, allowEmpty = false }) {
  return (
    <div className="chips" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`chip ${value === opt.value ? 'chip-active' : ''}`}
          onClick={() => onChange(allowEmpty && value === opt.value ? '' : opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function MultiChips({ options, values, onChange }) {
  const toggle = (v) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div className="chips" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`chip ${values.includes(opt.value) ? 'chip-active' : ''}`}
          onClick={() => toggle(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// En-tête de page : petit sur-titre, titre, sous-titre explicatif et action à droite.
export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header className="page-header">
      <div className="page-header-row">
        <div className="grow">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
        </div>
        {action}
      </div>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

// Titre de section avec numéro d'étape (« 1 · Choisis ton permis »).
export function SectionHead({ step, done = false, title, subtitle, id }) {
  return (
    <div className="section-head" id={id}>
      {step != null && <span className={`step-badge ${done ? 'done' : ''}`}>{done ? '✓' : step}</span>}
      <div className="grow">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

// Anneau de progression (0–100).
export function ProgressRing({ value, size = 72, color, label }) {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div
      className="ring"
      role="img"
      aria-label={label ?? `${v} %`}
      style={{ '--value': v, '--size': `${size}px`, ...(color ? { '--ring-color': color } : {}) }}
    >
      <span>{v}%</span>
    </div>
  );
}

// Barre d'étapes : steps = [{ id, label }], current = index de l'étape en cours.
export function Stepper({ steps, current }) {
  return (
    <ol className="stepper" aria-label={steps.map((s) => s.label).join(' → ')}>
      {steps.map((s, i) => (
        <li
          key={s.id}
          className={`stepper-item ${i < current ? 'done' : i === current ? 'current' : ''}`}
          aria-current={i === current ? 'step' : undefined}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon" aria-hidden="true">{icon}</div>}
      <strong>{title}</strong>
      {text && <p className="small">{text}</p>}
      {action}
    </div>
  );
}

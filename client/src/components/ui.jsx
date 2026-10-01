import { STATUS_LABELS } from '../api.js';

export function Stars({ value, count }) {
  if (value == null) return <span className="muted">Nouveau</span>;
  return (
    <span className="stars">
      ★ {value.toFixed(1)}
      {count != null && <span className="muted"> ({count})</span>}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
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

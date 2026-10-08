import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useI18n } from '../../i18n.jsx';
import { useAuth } from '../../auth.jsx';
import { Chips, ErrorMessage, PageHeader } from '../../components/ui.jsx';
import '../../styles/pages.css';

const CATEGORIES = ['AM', 'A', 'B', 'C', 'D', 'G'];
// Historique propre à chaque compte : sur un appareil partagé, l'élève suivant ne le voit pas.
const HISTORY_KEY = (userId, category) => `autoschub.coach.${userId}.${category}`;
const MAX_HISTORY = 30;

const loadHistory = (userId, category) => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY(userId, category)) ?? '[]');
  } catch {
    return [];
  }
};
const saveHistory = (userId, category, messages) => {
  try {
    localStorage.setItem(HISTORY_KEY(userId, category), JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {
    // stockage indisponible : l'historique reste en mémoire
  }
};

// Affichage du texte du coach : paragraphes, listes à puces et **gras** (sans HTML brut).
function RichText({ text }) {
  const blocks = String(text).split(/\n{2,}/);
  const inline = (line, key) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong> : part,
    );
  return blocks.map((block, b) => {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length && lines.every((l) => /^\s*([-•*]|\d+\.)\s+/.test(l))) {
      return (
        <ul key={b}>
          {lines.map((l, i) => (
            <li key={i}>{inline(l.replace(/^\s*([-•*]|\d+\.)\s+/, ''), `${b}-${i}`)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={b}>
        {lines.map((l, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {inline(l.replace(/^#+\s*/, ''), `${b}-${i}`)}
          </span>
        ))}
      </p>
    );
  });
}

export default function Coach() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState(() => (CATEGORIES.includes(params.get('category')) ? params.get('category') : 'B'));
  const [tab, setTab] = useState(params.get('tab') === 'plan' ? 'plan' : 'chat');
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState(() => loadHistory(user.id, category));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const endRef = useRef(null);
  const explainDone = useRef(false);

  useEffect(() => {
    api('/coach/status')
      .then(setStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMessages(loadHistory(user.id, category));
  }, [user.id, category]);

  useEffect(() => {
    if (tab !== 'plan') return;
    setPlan(null);
    api(`/coach/plan?category=${category}`)
      .then(setPlan)
      .catch((err) => setError(err.message));
  }, [tab, category]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, busy]);

  const push = (next) => {
    setMessages(next);
    saveHistory(user.id, category, next);
  };

  const call = async (path, body, shown) => {
    setBusy(true);
    setError('');
    const withQuestion = [...messages, { role: 'user', content: shown }];
    setMessages(withQuestion);
    try {
      const data = await api(path, { method: 'POST', body: { category, ...body } });
      push([...withQuestion, { role: 'assistant', content: data.reply, source: data.source }]);
      setStatus((s) => (s ? { ...s, quota: data.quota } : s));
    } catch (err) {
      setMessages(messages);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const send = (text) => {
    const content = text.trim();
    if (!content || busy) return;
    setInput('');
    const history = [...messages, { role: 'user', content }].map(({ role, content: c }) => ({ role, content: c }));
    call('/coach/chat', { messages: history.slice(-10) }, content);
  };

  // Ouvert depuis une correction de quiz : « Pourquoi ? » sur une question ratée.
  useEffect(() => {
    const questionId = params.get('explain');
    if (!questionId || explainDone.current) return;
    explainDone.current = true;
    const given = params.get('given');
    setParams({ category }, { replace: true });
    call('/coach/explain', { questionId, given: given === null || given === '' ? null : Number(given) }, t('coach.explainRequest'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = [t('coach.suggest1'), t('coach.suggest2'), t('coach.suggest3'), t('coach.suggest4')];
  const quota = status?.quota;

  return (
    <div className="page coach-page pg">
      <PageHeader
        eyebrow={t('coach.eyebrow')}
        title={t('coach.title')}
        subtitle={t('coach.intro')}
        action={
          status && (
            <span className={`badge ${status.ai ? 'badge-accepted' : 'badge-pending'}`} title={status.ai ? t('coach.aiOn') : t('coach.aiOff')}>
              {status.ai ? t('coach.aiBadge') : t('coach.offlineBadge')}
            </span>
          )
        }
      />
      <div className="pg-field-label">{t('coach.categoryLabel')}</div>
      <Chips options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={category} onChange={setCategory} />
      <div className="chips" role="tablist">
        {['chat', 'plan'].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`chip ${tab === id ? 'chip-active' : ''}`} onClick={() => setTab(id)}>
            {t(`coach.tab_${id}`)}
          </button>
        ))}
      </div>
      <ErrorMessage error={error} />

      {tab === 'chat' && (
        <>
          <div className="coach-thread" aria-live="polite">
            {!messages.length && (
              <div className="coach-welcome card">
                <strong>{t('coach.welcomeTitle')}</strong>
                <span className="small">{t('coach.welcomeText')}</span>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`coach-msg coach-${m.role}`}>
                {m.role === 'assistant' ? <RichText text={m.content} /> : <p>{m.content}</p>}
                {m.role === 'assistant' && m.source === 'offline' && <span className="small muted">{t('coach.offlineNote')}</span>}
              </div>
            ))}
            {busy && <div className="coach-msg coach-assistant coach-typing">{t('coach.thinking')}</div>}
            <div ref={endRef} />
          </div>

          {!messages.length && (
            <div className="chips">
              {suggestions.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={busy}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="coach-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <textarea
              rows={2}
              maxLength={1500}
              value={input}
              placeholder={t('coach.placeholder')}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button className="btn btn-primary" disabled={busy || !input.trim()}>
              {t('coach.send')}
            </button>
          </form>
          <div className="row-between small muted">
            <span>{quota ? t('coach.quota', { remaining: quota.remaining, limit: quota.limit }) : ''}</span>
            {messages.length > 0 && (
              <button type="button" className="link-button small" onClick={() => push([])}>
                {t('coach.clear')}
              </button>
            )}
          </div>
          <p className="small muted">{t('coach.disclaimer')}</p>
        </>
      )}

      {tab === 'plan' && (
        <>
          {!plan && <p className="muted">{t('common.loading')}</p>}
          {plan && (
            <>
              <div className="card">
                <div className="row-between">
                  <strong>{t('coach.readiness')}</strong>
                  <strong>{plan.readiness} %</strong>
                </div>
                <div className="progress">
                  <div style={{ width: `${plan.readiness}%` }} />
                </div>
                <span className="small">{plan.headline}</span>
              </div>
              <ol className="plan-days">
                {plan.days.map((d) => (
                  <li key={d.day} className="card">
                    <strong>{t('coach.day', { day: d.day })}</strong>
                    <ul>
                      {d.tasks.map((task, i) => (
                        <li key={i} className="small">
                          {task.type === 'coach' ? (
                            <button
                              type="button"
                              className="link-button small"
                              onClick={() => {
                                setTab('chat');
                                send(t('coach.explainTheme', { theme: task.themeLabel ?? task.theme }));
                              }}
                            >
                              🤖 {task.label}
                            </button>
                          ) : task.type === 'rest' ? (
                            <span>☕ {task.label}</span>
                          ) : (
                            <Link to="/theorie">
                              {task.type === 'exam' ? '📝' : task.type === 'review' ? '🔁' : '🎯'} {task.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { usePolling } from '../hooks.js';
import { ErrorMessage } from './ui.jsx';
import { useI18n } from '../i18n.jsx';

const toDate = (value) => new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);

// Conversation élève ↔ moniteur pour une leçon (rafraîchie toutes les 5 s quand elle est ouverte).
export default function MessageThread({ bookingId, onRead }) {
  const { t, locale } = useI18n();
  const time = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    [locale],
  );
  const { data, error, refresh } = usePolling(`/bookings/${bookingId}/messages`, 5000);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endRef = useRef(null);
  const count = data?.messages.length ?? 0;

  useEffect(() => {
    if (data) onRead?.();
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [count]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setSendError('');
    try {
      await api(`/bookings/${bookingId}/messages`, { method: 'POST', body: { body } });
      setBody('');
      await refresh();
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="thread">
      <ErrorMessage error={error} />
      {data && !count && <p className="muted small center">{t('messages.empty')}</p>}
      <div className="thread-messages">
        {data?.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.mine ? 'bubble-mine' : ''}`}>
            {!m.mine && <strong className="small">{m.senderName}</strong>}
            <p>{m.body}</p>
            <span className="bubble-time">{time.format(toDate(m.createdAt))}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {data?.canWrite !== false && (
        <form className="thread-form" onSubmit={send}>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('messages.placeholder')}
            maxLength={1000}
            aria-label={t('messages.label')}
          />
          <button className="btn btn-primary" disabled={sending || !body.trim()}>
            {t('messages.send')}
          </button>
        </form>
      )}
      <ErrorMessage error={sendError} />
    </div>
  );
}

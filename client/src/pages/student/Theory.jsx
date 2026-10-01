import { useEffect, useState } from 'react';
import { api, formatDateTime } from '../../api.js';
import { Chips, ErrorMessage } from '../../components/ui.jsx';

export default function Theory() {
  const [meta, setMeta] = useState(null);
  const [category, setCategory] = useState('B');
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const loadHistory = () =>
    api('/theory/history')
      .then((d) => setHistory(d.attempts))
      .catch(() => {});

  useEffect(() => {
    api('/theory/categories').then(setMeta).catch((err) => setError(err.message));
    loadHistory();
  }, []);

  const start = async (mode, theme) => {
    setError('');
    try {
      const params = new URLSearchParams({ category, mode, ...(theme ? { theme } : {}) });
      setQuiz(await api(`/theory/quiz?${params}`));
      setResult(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const finish = async (answers) => {
    try {
      const res = await api('/theory/submit', {
        method: 'POST',
        body: {
          category: quiz.category,
          mode: quiz.mode,
          theme: quiz.theme,
          questionIds: quiz.questions.map((q) => q.id),
          answers,
        },
      });
      setResult(res);
      setQuiz(null);
      loadHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  if (quiz) return <Quiz quiz={quiz} onFinish={finish} onQuit={() => setQuiz(null)} />;
  if (result) return <Result result={result} onBack={() => setResult(null)} />;

  const current = meta?.categories.find((c) => c.code === category);

  return (
    <div className="page">
      <h1>Théorie</h1>
      <p className="muted">Entraîne-toi à l’examen théorique belge, par thème ou en conditions réelles.</p>
      <ErrorMessage error={error} />
      {meta && (
        <>
          <Chips
            options={meta.categories.map((c) => ({ value: c.code, label: c.label }))}
            value={category}
            onChange={setCategory}
          />

          <div className="card exam-card">
            <h2>📝 Examen blanc</h2>
            <p className="small">
              {Math.min(meta.rules.questionCount, current?.questionCount ?? 0)} questions · {meta.rules.durationMinutes} min ·
              réussite à 41/50 (82 %) · une faute grave = {meta.rules.gravePenalty} points.
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={() => start('exam')}>
              Lancer l’examen blanc
            </button>
          </div>

          <h2 className="section-title">S’entraîner par thème</h2>
          <div className="theme-grid">
            <button type="button" className="theme" onClick={() => start('practice')}>
              🎲 Questions aléatoires
            </button>
            {current?.themes.map((t) => (
              <button key={t} type="button" className="theme" onClick={() => start('practice', t)}>
                {t}
              </button>
            ))}
          </div>
        </>
      )}

      {history.length > 0 && (
        <>
          <h2 className="section-title">Mes derniers résultats</h2>
          <ul className="history">
            {history.slice(0, 10).map((a) => (
              <li key={a.id} className="row-between">
                <span className="small">
                  {a.mode === 'exam' ? 'Examen' : a.theme || 'Entraînement'} · {a.category}
                  <br />
                  <span className="muted">{formatDateTime(`${a.createdAt.replace(' ', 'T')}Z`)}</span>
                </span>
                <span className={a.passed ? 'pass' : 'fail'}>
                  {a.score}/{a.maxScore}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="muted small">
        Questions d’entraînement indicatives. L’examen officiel se passe dans un centre agréé (GOCA) de votre région.
      </p>
    </div>
  );
}

function Quiz({ quiz, onFinish, onQuit }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(quiz.durationMinutes ? quiz.durationMinutes * 60 : null);
  const question = quiz.questions[index];
  const isLast = index === quiz.questions.length - 1;

  useEffect(() => {
    if (secondsLeft == null) return undefined;
    if (secondsLeft <= 0) {
      onFinish(answers);
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (choice) => setAnswers({ ...answers, [question.id]: choice });

  return (
    <div className="page quiz">
      <div className="row-between">
        <button type="button" className="back" onClick={onQuit}>
          ✕ Quitter
        </button>
        {secondsLeft != null && (
          <span className={`timer ${secondsLeft < 60 ? 'fail' : ''}`}>
            ⏱ {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </span>
        )}
      </div>
      <div className="progress">
        <div style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }} />
      </div>
      <p className="muted small">
        Question {index + 1}/{quiz.questions.length} · {question.theme}
        {question.grave && quiz.mode === 'practice' && ' · ⚠️ faute grave'}
      </p>
      <h2 className="question">{question.question}</h2>
      <div className="answers">
        {question.choices.map((choice, i) => (
          <button
            key={choice}
            type="button"
            className={`answer ${answers[question.id] === i ? 'answer-selected' : ''}`}
            onClick={() => choose(i)}
          >
            <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
            {choice}
          </button>
        ))}
      </div>
      <div className="row quiz-nav">
        <button type="button" className="btn btn-secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ← Précédente
        </button>
        {isLast ? (
          <button type="button" className="btn btn-primary" onClick={() => onFinish(answers)}>
            Terminer
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setIndex(index + 1)}>
            Suivante →
          </button>
        )}
      </div>
    </div>
  );
}

function Result({ result, onBack }) {
  const mistakes = result.corrections.filter((c) => !c.correct);
  return (
    <div className="page">
      <button type="button" className="back" onClick={onBack}>
        ← Retour
      </button>
      <div className={`card result ${result.passed ? 'result-pass' : 'result-fail'}`}>
        <div className="result-score">
          {result.score}/{result.maxScore}
        </div>
        <strong>{result.passed ? '🎉 Réussi !' : 'Pas encore…'}</strong>
        <p className="small">
          {result.correct} bonnes réponses sur {result.total} · {result.graveFaults} faute(s) grave(s) · seuil de réussite{' '}
          {result.passMark}
        </p>
      </div>
      {mistakes.length > 0 && <h2 className="section-title">Corrections ({mistakes.length})</h2>}
      {mistakes.map((c) => (
        <article key={c.id} className="card correction">
          <p className="small muted">
            {c.theme}
            {c.grave && ' · ⚠️ faute grave (-5)'}
          </p>
          <strong>{c.question}</strong>
          <ul>
            {c.choices.map((choice, i) => (
              <li key={choice} className={i === c.answer ? 'pass' : i === c.given ? 'fail' : ''}>
                {i === c.answer ? '✔ ' : i === c.given ? '✘ ' : '• '}
                {choice}
              </li>
            ))}
          </ul>
          {c.given == null && <p className="small fail">Sans réponse</p>}
          <p className="small">{c.explanation}</p>
        </article>
      ))}
    </div>
  );
}

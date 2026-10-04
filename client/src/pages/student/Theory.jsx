import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDateTime } from '../../api.js';
import { Chips, ErrorMessage } from '../../components/ui.jsx';

export default function Theory() {
  const [meta, setMeta] = useState(null);
  const [category, setCategory] = useState('B');
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [freeExamsLeft, setFreeExamsLeft] = useState(null);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Garde synchrone : un double clic ou la fin du chrono pendant l'envoi ne corrige pas deux fois.
  const submittingRef = useRef(false);

  const loadHistory = () =>
    api('/theory/history')
      .then((d) => {
        setHistory(d.attempts);
        setFreeExamsLeft(d.freeExamsLeft);
      })
      .catch(() => {});

  useEffect(() => {
    api('/theory/categories', { auth: false }).then(setMeta).catch((err) => setError(err.message));
    loadHistory();
  }, []);

  // Préparation, thèmes faibles et erreurs à revoir pour la catégorie choisie.
  useEffect(() => {
    if (quiz) return undefined;
    let alive = true;
    api(`/theory/insights?category=${category}`)
      .then((d) => alive && setInsights(d))
      .catch(() => alive && setInsights(null));
    return () => {
      alive = false;
    };
  }, [category, quiz, result]);

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
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const res = await api('/theory/submit', {
        method: 'POST',
        body: { quizToken: quiz.quizToken, answers },
      });
      setResult(res);
      setQuiz(null);
      loadHistory();
    } catch (err) {
      setError(err.message);
      // Quiz expiré ou déjà corrigé : inutile de rester dessus.
      if ([400, 402, 403, 409].includes(err.status)) setQuiz(null);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (quiz) {
    return (
      <Quiz quiz={quiz} error={error} submitting={submitting} onFinish={finish} onQuit={() => setQuiz(null)} />
    );
  }
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

          {insights && <Insights insights={insights} onReview={() => start('review')} onTheme={(t) => start('practice', t)} />}

          <div className="card exam-card">
            <h2>📝 Examen blanc</h2>
            <p className="small">
              {Math.min(meta.rules.questionCount, current?.questionCount ?? 0)} questions · {meta.rules.durationMinutes} min ·
              réussite à 41/50 (82 %) · une faute grave = {meta.rules.gravePenalty} points.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={freeExamsLeft === 0}
              onClick={() => start('exam')}
            >
              Lancer l’examen blanc
            </button>
            {freeExamsLeft != null && (
              <p className="small center">
                {freeExamsLeft} examen(s) blanc(s) gratuit(s) restant(s) cette semaine ·{' '}
                <Link to="/pack">illimité avec un pack</Link>
              </p>
            )}
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
                  {a.mode === 'exam' ? 'Examen' : a.mode === 'review' ? 'Révision des erreurs' : a.theme || 'Entraînement'} ·{' '}
                  {a.category}
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

// Score de préparation (0–100), thèmes à travailler et révision espacée des erreurs.
function Insights({ insights, onReview, onTheme }) {
  const { readiness, ready, toReview, themes, examsTaken } = insights;
  const weak = themes.filter((t) => t.rate !== null && t.rate < 80).slice(0, 3);
  const untouched = themes.filter((t) => t.rate === null).length;
  const tone = readiness >= 85 ? 'good' : readiness >= 60 ? 'mid' : 'low';
  return (
    <div className="card insights">
      <div className="row">
        <div className={`gauge gauge-${tone}`} style={{ '--value': readiness }} aria-label={`Préparation ${readiness} %`}>
          <span>{readiness}%</span>
        </div>
        <div className="grow">
          <strong>{ready ? 'Prêt·e pour l’examen 🎉' : 'Ma préparation'}</strong>
          <p className="small muted">
            {examsTaken < 2
              ? 'Passe au moins 2 examens blancs pour un score fiable.'
              : ready
                ? 'Tes derniers examens et tes thèmes sont au niveau : inscris-toi à l’examen officiel.'
                : 'Objectif 85 % : révise tes erreurs et tes thèmes les plus faibles.'}
          </p>
        </div>
      </div>
      {toReview > 0 && (
        <button type="button" className="btn btn-secondary btn-block" onClick={onReview}>
          🔁 Revoir mes erreurs ({toReview})
        </button>
      )}
      {weak.length > 0 && (
        <div>
          <div className="label">À travailler</div>
          {weak.map((t) => (
            <button key={t.theme} type="button" className="theme-row" onClick={() => onTheme(t.theme)}>
              <span className="grow">{t.theme}</span>
              <span className="theme-meter">
                <span style={{ width: `${t.rate}%` }} />
              </span>
              <span className="small fail">{t.rate}%</span>
            </button>
          ))}
        </div>
      )}
      {untouched > 0 && <p className="muted small">{untouched} thème(s) pas encore travaillé(s).</p>}
    </div>
  );
}

function Quiz({ quiz, error, submitting, onFinish, onQuit }) {
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
        {question.grave && quiz.mode !== 'exam' && ' · ⚠️ faute grave'}
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
      <ErrorMessage error={error} />
      <div className="row quiz-nav">
        <button type="button" className="btn btn-secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ← Précédente
        </button>
        {isLast ? (
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => onFinish(answers)}>
            {submitting ? 'Correction…' : 'Terminer'}
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

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDateTime } from '../../api.js';
import { Chips, ErrorMessage } from '../../components/ui.jsx';
import { useT } from '../../i18n.jsx';

export default function Theory() {
  const t = useT();
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
  if (result) return <Result category={category} result={result} onBack={() => setResult(null)} />;

  const current = meta?.categories.find((c) => c.code === category);

  return (
    <div className="page">
      <h1>{t('theory.title')}</h1>
      <p className="muted">{t('theory.intro')}</p>
      <ErrorMessage error={error} />
      {meta && (
        <>
          <Chips
            options={meta.categories.map((c) => ({ value: c.code, label: c.label }))}
            value={category}
            onChange={setCategory}
          />

          {insights && <Insights insights={insights} onReview={() => start('review')} onTheme={(theme) => start('practice', theme)} />}

          <Link className="card card-link coach-card" to={`/coach?category=${category}`}>
            <strong>{t('theory.coachTitle')}</strong>
            <span className="small">{t('theory.coachText')}</span>
          </Link>

          <div className="card exam-card">
            <h2>{t('theory.mockExam')}</h2>
            <p className="small">
              {t('theory.examRules', {
                count: Math.min(meta.rules.questionCount, current?.questionCount ?? 0),
                minutes: meta.rules.durationMinutes,
                penalty: meta.rules.gravePenalty,
              })}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={freeExamsLeft === 0}
              onClick={() => start('exam')}
            >
              {t('theory.startExam')}
            </button>
            {freeExamsLeft != null && (
              <p className="small center">
                {t('theory.freeExamsLeft', { count: freeExamsLeft })} ·{' '}
                <Link to="/pack">{t('theory.unlimitedWithPack')}</Link>
              </p>
            )}
          </div>

          <h2 className="section-title">{t('theory.practiceByTheme')}</h2>
          <div className="theme-grid">
            <button type="button" className="theme" onClick={() => start('practice')}>
              {t('theory.randomQuestions')}
            </button>
            {current?.themes.map((theme) => (
              <button key={theme} type="button" className="theme" onClick={() => start('practice', theme)}>
                {meta.themeLabels?.[theme] ?? theme}
              </button>
            ))}
          </div>
        </>
      )}

      {history.length > 0 && (
        <>
          <h2 className="section-title">{t('theory.lastResults')}</h2>
          <ul className="history">
            {history.slice(0, 10).map((a) => (
              <li key={a.id} className="row-between">
                <span className="small">
                  {a.mode === 'exam'
                    ? t('theory.modeExam')
                    : a.mode === 'review'
                      ? t('theory.modeReview')
                      : a.themeLabel || a.theme || t('theory.modePractice')}{' '}
                  ·{' '}
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
      <p className="muted small">{t('theory.disclaimer')}</p>
    </div>
  );
}

// Score de préparation (0–100), thèmes à travailler et révision espacée des erreurs.
function Insights({ insights, onReview, onTheme }) {
  const t = useT();
  const { readiness, ready, toReview, themes, examsTaken } = insights;
  const weak = themes.filter((th) => th.rate !== null && th.rate < 80).slice(0, 3);
  const untouched = themes.filter((th) => th.rate === null).length;
  const tone = readiness >= 85 ? 'good' : readiness >= 60 ? 'mid' : 'low';
  return (
    <div className="card insights">
      <div className="row">
        <div className={`gauge gauge-${tone}`} style={{ '--value': readiness }} aria-label={t('theory.readinessLabel', { value: readiness })}>
          <span>{readiness}%</span>
        </div>
        <div className="grow">
          <strong>{ready ? t('theory.ready') : t('theory.myReadiness')}</strong>
          <p className="small muted">
            {examsTaken < 2
              ? t('theory.needMoreExams')
              : ready
                ? t('theory.readyText')
                : t('theory.goalText')}
          </p>
        </div>
      </div>
      {toReview > 0 && (
        <button type="button" className="btn btn-secondary btn-block" onClick={onReview}>
          {t('theory.reviewMistakes', { count: toReview })}
        </button>
      )}
      {weak.length > 0 && (
        <div>
          <div className="label">{t('theory.toWorkOn')}</div>
          {weak.map((th) => (
            <button key={th.theme} type="button" className="theme-row" onClick={() => onTheme(th.theme)}>
              <span className="grow">{th.themeLabel ?? th.theme}</span>
              <span className="theme-meter">
                <span style={{ width: `${th.rate}%` }} />
              </span>
              <span className="small fail">{th.rate}%</span>
            </button>
          ))}
        </div>
      )}
      {untouched > 0 && <p className="muted small">{t('theory.untouchedThemes', { count: untouched })}</p>}
    </div>
  );
}

function Quiz({ quiz, error, submitting, onFinish, onQuit }) {
  const t = useT();
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
          {t('theory.quit')}
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
        {t('theory.questionProgress', {
          index: index + 1,
          total: quiz.questions.length,
          theme: question.themeLabel ?? question.theme,
        })}
        {question.grave && quiz.mode !== 'exam' && t('theory.graveFault')}
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
          {t('theory.previous')}
        </button>
        {isLast ? (
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => onFinish(answers)}>
            {submitting ? t('theory.correcting') : t('theory.finish')}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setIndex(index + 1)}>
            {t('theory.next')}
          </button>
        )}
      </div>
    </div>
  );
}

function Result({ result, category, onBack }) {
  const t = useT();
  const mistakes = result.corrections.filter((c) => !c.correct);
  return (
    <div className="page">
      <button type="button" className="back" onClick={onBack}>
        {t('common.back')}
      </button>
      <div className={`card result ${result.passed ? 'result-pass' : 'result-fail'}`}>
        <div className="result-score">
          {result.score}/{result.maxScore}
        </div>
        <strong>{result.passed ? t('theory.passed') : t('theory.notYet')}</strong>
        <p className="small">
          {t('theory.resultSummary', {
            correct: result.correct,
            total: result.total,
            count: result.graveFaults,
            passMark: result.passMark,
          })}
        </p>
      </div>
      {mistakes.length > 0 && <h2 className="section-title">{t('theory.corrections', { count: mistakes.length })}</h2>}
      {mistakes.map((c) => (
        <article key={c.id} className="card correction">
          <p className="small muted">
            {c.themeLabel ?? c.theme}
            {c.grave && t('theory.graveFaultPenalty')}
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
          {c.given == null && <p className="small fail">{t('theory.noAnswer')}</p>}
          <p className="small">{c.explanation}</p>
          <Link className="small" to={`/coach?explain=${encodeURIComponent(c.id)}&given=${c.given ?? ''}&category=${category}`}>
            {t('theory.askCoach')}
          </Link>
        </article>
      ))}
    </div>
  );
}

import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';
import { DEMO_PASSWORD, seed } from '../src/seed.js';
import { gradeAnswers } from '../src/routes/theory.js';

let server;
let baseUrl;
let db;

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

const login = async (email) =>
  (await api('/api/auth/login', { method: 'POST', body: { email, password: DEMO_PASSWORD } })).data.token;

before(async () => {
  db = openDb(':memory:');
  seed(db);
  server = createApp(db).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

describe('auth', () => {
  test('inscription élève puis /me', async () => {
    const { status, data } = await api('/api/auth/register', {
      method: 'POST',
      body: { role: 'student', firstName: 'Léa', lastName: 'Test', email: 'lea@test.be', password: 'motdepasse' },
    });
    assert.equal(status, 201);
    const me = await api('/api/auth/me', { token: data.token });
    assert.equal(me.data.user.email, 'lea@test.be');
  });

  test('refuse un moniteur sans agrément', async () => {
    const { status } = await api('/api/auth/register', {
      method: 'POST',
      body: {
        role: 'instructor', firstName: 'A', lastName: 'B', email: 'x@test.be', password: 'motdepasse',
        instructor: { categories: ['B'] },
      },
    });
    assert.equal(status, 400);
  });

  test('mauvais mot de passe', async () => {
    const { status } = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'eleve@autoschub.be', password: 'faux' },
    });
    assert.equal(status, 401);
  });
});

describe('recherche de moniteurs', () => {
  test('trie par distance et filtre par catégorie', async () => {
    const { data } = await api('/api/instructors?lat=50.85&lng=4.35&category=A&maxKm=200');
    assert.ok(data.instructors.length >= 2);
    assert.ok(data.instructors.every((i) => i.categories.includes('A')));
    const online = data.instructors.filter((i) => i.isOnline);
    for (let k = 1; k < online.length; k += 1) {
      assert.ok(online[k - 1].distanceKm <= online[k].distanceKm);
    }
  });
});

describe('cycle de réservation', () => {
  test('élève réserve, moniteur accepte, démarre, termine, élève note', async () => {
    const student = await login('eleve@autoschub.be');
    const instructor = await login('moniteur@autoschub.be');
    const { data: list } = await api('/api/instructors?category=B', { token: student });
    const sophie = list.instructors.find((i) => i.firstName === 'Sophie');

    const created = await api('/api/bookings', {
      method: 'POST',
      token: student,
      body: { instructorId: sophie.id, category: 'B', durationMin: 90, pickupAddress: 'Gare Centrale, Bruxelles' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.booking.status, 'pending');
    assert.equal(created.data.booking.price, 87);
    const id = created.data.booking.id;

    const conflict = await api('/api/bookings', {
      method: 'POST',
      token: student,
      body: { instructorId: sophie.id, category: 'B', durationMin: 60, pickupAddress: 'Ailleurs' },
    });
    assert.equal(conflict.status, 409);

    const forbidden = await api(`/api/bookings/${id}/status`, {
      method: 'POST', token: student, body: { status: 'accepted' },
    });
    assert.equal(forbidden.status, 403);

    for (const status of ['accepted', 'en_route', 'in_progress', 'completed']) {
      const r = await api(`/api/bookings/${id}/status`, { method: 'POST', token: instructor, body: { status } });
      assert.equal(r.status, 200, `transition vers ${status}`);
      assert.equal(r.data.booking.status, status);
    }

    const review = await api(`/api/bookings/${id}/review`, {
      method: 'POST', token: student, body: { rating: 5, comment: 'Top !' },
    });
    assert.equal(review.status, 200);
    const again = await api(`/api/bookings/${id}/review`, { method: 'POST', token: student, body: { rating: 4 } });
    assert.equal(again.status, 409);

    const stats = await api('/api/instructors/me/stats', { token: instructor });
    assert.equal(stats.data.lessons, 1);
    assert.equal(stats.data.net, 69.6);
  });

  test('refuse une catégorie non enseignée', async () => {
    const student = await login('eleve@autoschub.be');
    const { data } = await api('/api/instructors?category=CE&maxKm=500');
    const r = await api('/api/bookings', {
      method: 'POST',
      token: student,
      body: {
        instructorId: data.instructors[0].id, category: 'AM', pickupAddress: 'x',
        startAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    assert.equal(r.status, 400);
  });
});

describe('théorie', () => {
  test('quiz sans réponses puis correction enregistrée', async () => {
    const token = await login('eleve@autoschub.be');
    const quiz = await api('/api/theory/quiz?category=B&mode=exam', { token });
    assert.ok(quiz.data.questions.length > 20);
    assert.ok(quiz.data.questions.every((q) => q.answer === undefined));

    const questionIds = quiz.data.questions.map((q) => q.id);
    const result = await api('/api/theory/submit', {
      method: 'POST',
      token,
      body: { category: 'B', mode: 'exam', questionIds, answers: {} },
    });
    assert.equal(result.data.score, 0);
    assert.equal(result.data.passed, false);

    const history = await api('/api/theory/history', { token });
    assert.equal(history.data.attempts.length, 1);
  });

  test('barème : faute grave = 5 points', () => {
    const questions = [
      { id: 'a', answer: 0, grave: true, choices: [] },
      { id: 'b', answer: 1, grave: false, choices: [] },
      ...Array.from({ length: 48 }, (_, i) => ({ id: `q${i}`, answer: 0, grave: false, choices: [] })),
    ];
    const answers = Object.fromEntries(questions.map((q) => [q.id, q.answer]));
    answers.a = 1;
    const r = gradeAnswers(questions, answers);
    assert.equal(r.score, 45);
    assert.equal(r.passMark, 41);
    assert.equal(r.passed, true);
    answers.b = 0;
    answers.q0 = 1;
    answers.q1 = 1;
    answers.q2 = 1;
    assert.equal(gradeAnswers(questions, answers).score, 41);
    answers.q3 = 1;
    assert.equal(gradeAnswers(questions, answers).passed, false);
  });
});

describe('packs d’abonnement', () => {
  const inDays = (d, hour = 10) => {
    const date = new Date(Date.now() + d * 86400000);
    date.setUTCHours(hour, 0, 0, 0);
    return date.toISOString();
  };

  test('examens blancs limités sans pack, heures incluses et réduction avec pack', async () => {
    const { data: reg } = await api('/api/auth/register', {
      method: 'POST',
      body: { role: 'student', firstName: 'Tom', lastName: 'Pack', email: 'tom@test.be', password: 'motdepasse' },
    });
    const token = reg.token;

    assert.equal((await api('/api/subscriptions/me', { token })).data.subscription, null);
    assert.equal((await api('/api/theory/quiz?category=B&mode=exam')).status, 401);

    for (let i = 0; i < 2; i += 1) {
      const quiz = await api('/api/theory/quiz?category=B&mode=exam', { token });
      assert.equal(quiz.status, 200);
      await api('/api/theory/submit', {
        method: 'POST', token,
        body: { category: 'B', mode: 'exam', questionIds: quiz.data.questions.map((q) => q.id), answers: {} },
      });
    }
    assert.equal((await api('/api/theory/quiz?category=B&mode=exam', { token })).status, 402);

    const sub = await api('/api/subscriptions', { method: 'POST', token, body: { planId: 'conduite', category: 'B' } });
    assert.equal(sub.status, 201);
    assert.equal(sub.data.subscription.remainingMinutes, 180);
    assert.equal(sub.data.journey.steps.length, 6);
    const again = await api('/api/subscriptions', { method: 'POST', token, body: { planId: 'integral', category: 'B' } });
    assert.equal(again.status, 409);
    assert.equal((await api('/api/theory/quiz?category=B&mode=exam', { token })).status, 200);

    const { data: list } = await api('/api/instructors?category=B');
    const lucas = list.instructors.find((i) => i.firstName === 'Lucas'); // 50 €/h

    const quote = await api(`/api/bookings/quote?instructorId=${lucas.id}&category=B&durationMin=120`, { token });
    assert.deepEqual(quote.data, { lessonPrice: 100, studentPrice: 0, coveredMinutes: 120, withPack: true });

    const first = await api('/api/bookings', {
      method: 'POST', token,
      body: { instructorId: lucas.id, category: 'B', durationMin: 120, pickupAddress: 'Rue A', startAt: inDays(3) },
    });
    assert.equal(first.data.booking.coveredMinutes, 120);
    assert.equal(first.data.booking.studentPrice, 0);
    assert.equal(first.data.booking.price, 100);

    const second = await api('/api/bookings', {
      method: 'POST', token,
      body: { instructorId: lucas.id, category: 'B', durationMin: 120, pickupAddress: 'Rue A', startAt: inDays(4) },
    });
    assert.equal(second.data.booking.coveredMinutes, 60);
    assert.equal(second.data.booking.studentPrice, 45); // 60 min à 50 € avec -10 %

    // Une annulation rend les heures au pack.
    await api(`/api/bookings/${first.data.booking.id}/status`, { method: 'POST', token, body: { status: 'cancelled' } });
    const me = await api('/api/subscriptions/me', { token });
    assert.equal(me.data.subscription.remainingMinutes, 120);

    // Catégorie hors pack : plein tarif.
    const other = await api(`/api/bookings/quote?instructorId=${lucas.id}&category=A&durationMin=60`, { token });
    assert.equal(other.data.studentPrice, 50);

    // Renouvellement mensuel : les heures incluses repartent à zéro.
    db.prepare("UPDATE subscriptions SET current_period_end = ? WHERE id = ?").run(
      new Date(Date.now() - 1000).toISOString(),
      me.data.subscription.id,
    );
    const renewed = await api('/api/subscriptions/me', { token });
    assert.equal(renewed.data.subscription.remainingMinutes, 180);
  });

  test('parcours : étapes déclarées puis permis obtenu clôture le pack', async () => {
    const token = await login('eleve@autoschub.be');
    await api('/api/subscriptions', { method: 'POST', token, body: { planId: 'integral', category: 'B' } });

    const bad = await api('/api/subscriptions/me/journey', { method: 'PATCH', token, body: { examDate: 'demain' } });
    assert.equal(bad.status, 400);

    const step = await api('/api/subscriptions/me/journey', {
      method: 'PATCH', token, body: { provisionalAt: '2026-09-01', examDate: '2026-12-15' },
    });
    const byId = Object.fromEntries(step.data.journey.steps.map((s) => [s.id, s]));
    assert.equal(byId.provisional.done, true);
    assert.equal(byId.exam.done, true);
    assert.equal(byId.driving.detail.startsWith('1.5 h'), true); // leçon terminée dans le test précédent
    assert.equal(step.data.journey.coach.firstName, 'Sophie');

    const cancel = await api('/api/subscriptions/me/cancel', { method: 'POST', token, body: {} });
    assert.equal(cancel.data.subscription.cancelAtPeriodEnd, true);

    const done = await api('/api/subscriptions/me/journey', {
      method: 'PATCH', token, body: { licenseObtainedAt: '2026-12-15' },
    });
    assert.equal(done.data.subscription.status, 'completed');
    assert.equal((await api('/api/subscriptions/me', { token })).data.subscription, null);
  });
});

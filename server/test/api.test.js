import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';
import { DEMO_PASSWORD, DEMO_PACK_EMAIL, seed, seedDemo, seedDemoPack } from '../src/seed.js';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildJourney, getActiveSubscription, serializeSubscription } from '../src/subscriptions.js';
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
  db = await openDb(':memory:');
  await seed(db);
  server = createApp(db).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  db.close();
});

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

    assert.ok(quiz.data.questions.every((q) => q.grave === undefined)); // gravité cachée en examen
    const result = await api('/api/theory/submit', {
      method: 'POST',
      token,
      body: { quizToken: quiz.data.quizToken, answers: {} },
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
        body: { quizToken: quiz.data.quizToken, answers: {} },
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
    await db.run(
      'UPDATE subscriptions SET current_period_end = ? WHERE id = ?',
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

    const impossible = await api('/api/subscriptions/me/journey', { method: 'PATCH', token, body: { examDate: '2026-13-45' } });
    assert.equal(impossible.status, 400);

    // Permis obtenu : plus de renouvellement, le pack reste actif jusqu'à la fin du mois payé.
    await api('/api/subscriptions/me/cancel', { method: 'POST', token, body: { resume: true } });
    const done = await api('/api/subscriptions/me/journey', {
      method: 'PATCH', token, body: { licenseObtainedAt: '2026-12-15' },
    });
    assert.equal(done.data.subscription.status, 'active');
    assert.equal(done.data.subscription.cancelAtPeriodEnd, true);
    assert.equal(done.data.subscription.licenseObtained, true);
    const again = await api('/api/subscriptions', { method: 'POST', token, body: { planId: 'integral', category: 'B' } });
    assert.equal(again.status, 409);

    await db.run(
      'UPDATE subscriptions SET current_period_end = ? WHERE id = ?',
      new Date(Date.now() - 1000).toISOString(),
      done.data.subscription.id,
    );
    assert.equal((await api('/api/subscriptions/me', { token })).data.subscription, null);
    const closed = await db.get('SELECT status FROM subscriptions WHERE id = ?', done.data.subscription.id);
    assert.equal(closed.status, 'completed');
  });
});

describe('corrections de la revue', () => {
  const register = async (email, extra = {}) =>
    api('/api/auth/register', {
      method: 'POST',
      body: { role: 'student', firstName: 'R', lastName: 'Test', email, password: 'motdepasse', ...extra },
    });

  test('examen blanc : seulement un quiz délivré par le serveur, une fois, par son destinataire', async () => {
    const token = (await register('forge@test.be')).data.token;
    const other = (await register('autre@test.be')).data.token;
    const { QUESTIONS } = await import('../src/data/questions.js');
    const q = QUESTIONS.find((x) => x.categories.includes('B'));

    // Ancien format (questions choisies par le client) : refusé.
    const forged = await api('/api/theory/submit', {
      method: 'POST', token,
      body: { category: 'B', mode: 'exam', questionIds: [q.id], answers: { [q.id]: q.answer } },
    });
    assert.equal(forged.status, 400);

    const quiz = await api('/api/theory/quiz?category=B&mode=exam', { token });
    const body = { quizToken: quiz.data.quizToken, answers: {} };
    assert.equal((await api('/api/theory/submit', { method: 'POST', token: other, body })).status, 403);
    assert.equal((await api('/api/theory/submit', { method: 'POST', token, body })).status, 200);
    assert.equal((await api('/api/theory/submit', { method: 'POST', token, body })).status, 409);

    // Jeton altéré : refusé. Jeton de quiz utilisé comme session : refusé.
    const [payload, sig] = quiz.data.quizToken.split('.');
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const tampered = `${Buffer.from(JSON.stringify({ ...data, ids: [q.id] })).toString('base64url')}.${sig}`;
    assert.equal((await api('/api/theory/submit', { method: 'POST', token, body: { quizToken: tampered } })).status, 400);
    assert.equal((await api('/api/auth/me', { token: quiz.data.quizToken })).status, 401);

    // Quota revérifié à la correction : deux quiz ouverts d'avance ne donnent pas un 3e examen.
    const q2 = await api('/api/theory/quiz?category=B&mode=exam', { token });
    const q3 = await api('/api/theory/quiz?category=B&mode=exam', { token });
    assert.equal((await api('/api/theory/submit', { method: 'POST', token, body: { quizToken: q2.data.quizToken } })).status, 200);
    assert.equal((await api('/api/theory/submit', { method: 'POST', token, body: { quizToken: q3.data.quizToken } })).status, 402);
  });

  test('inscription moniteur : tarif, position et langues validés', async () => {
    const base = { categories: ['B'], approvalNumber: 'AGR-1', lat: 50.85, lng: 4.35 };
    const reg = (email, instructor) => register(email, { role: 'instructor', instructor: { ...base, ...instructor } });
    assert.equal((await reg('neg@test.be', { hourlyRate: -40 })).status, 400);
    assert.equal((await reg('pos@test.be', { lat: 'abc' })).status, 400);
    assert.equal((await reg('lang@test.be', { languages: ['klingon'] })).status, 400);
    assert.equal((await register('num@test.be', { firstName: 42 })).status, 400);
    const ok = await reg('ok@test.be', { hourlyRate: 60, languages: ['nl', 'fr'] });
    assert.equal(ok.status, 201);
    const profile = await api('/api/instructors/me/profile', { token: ok.data.token });
    assert.equal(profile.data.instructor.hourlyRate, 60);
  });

  test('connexion bloquée après 10 échecs', async () => {
    await register('brute@test.be');
    const attempt = (password) =>
      api('/api/auth/login', { method: 'POST', body: { email: 'brute@test.be', password } });
    for (let i = 0; i < 10; i += 1) assert.equal((await attempt('mauvais')).status, 401);
    assert.equal((await attempt('mauvais')).status, 429);
    assert.equal((await attempt('motdepasse')).status, 429);
    await db.run('DELETE FROM login_attempts');
    assert.equal((await attempt('motdepasse')).status, 200);
  });

  test('statut et note : une seule mise à jour gagne en cas de requêtes simultanées', async () => {
    const student = (await register('race@test.be')).data.token;
    const instructor = await login('moniteur@autoschub.be');
    const { data: list } = await api('/api/instructors?category=B');
    const sophie = list.instructors.find((i) => i.firstName === 'Sophie');
    const startAt = new Date(Date.now() + 20 * 86400000).toISOString();
    const created = await api('/api/bookings', {
      method: 'POST', token: student,
      body: { instructorId: sophie.id, category: 'B', pickupAddress: 'Rue X', startAt },
    });
    const id = created.data.booking.id;

    // L'élève annule pendant que le moniteur refuse : une seule des deux transitions est appliquée.
    const [decline, cancel] = await Promise.all([
      api(`/api/bookings/${id}/status`, { method: 'POST', token: instructor, body: { status: 'declined' } }),
      api(`/api/bookings/${id}/status`, { method: 'POST', token: student, body: { status: 'cancelled' } }),
    ]);
    assert.deepEqual([decline.status, cancel.status].sort(), [200, 409]);

    await db.run(`UPDATE bookings SET status = 'completed' WHERE id = ?`, id);
    const before = await db.get('SELECT rating_count FROM instructors WHERE user_id = ?', sophie.id);
    const reviews = await Promise.all(
      [1, 2, 3].map(() => api(`/api/bookings/${id}/review`, { method: 'POST', token: student, body: { rating: 4 } })),
    );
    assert.deepEqual(reviews.map((r) => r.status).sort(), [200, 409, 409]);
    const after = await db.get('SELECT rating_count FROM instructors WHERE user_id = ?', sophie.id);
    assert.equal(after.rating_count, before.rating_count + 1);
  });

  test('un élève ne peut pas réserver deux leçons au même moment', async () => {
    const student = (await register('double@test.be')).data.token;
    const { data: list } = await api('/api/instructors?category=B&maxKm=500');
    const [a, b] = list.instructors;
    const startAt = new Date(Date.now() + 30 * 86400000).toISOString();
    const book = (instructorId) =>
      api('/api/bookings', {
        method: 'POST', token: student,
        body: { instructorId, category: 'B', pickupAddress: 'Rue Y', startAt },
      });
    assert.equal((await book(a.id)).status, 201);
    const clash = await book(b.id);
    assert.equal(clash.status, 409);
    assert.match(clash.data.error, /déjà une leçon/);
  });

  test('demandes sans réponse expirées : créneau libéré', async () => {
    const student = (await register('expire@test.be')).data.token;
    const { data: list } = await api('/api/instructors?category=B');
    const sophie = list.instructors.find((i) => i.firstName === 'Sophie');
    const startAt = new Date(Date.now() + 40 * 86400000).toISOString();
    const body = { instructorId: sophie.id, category: 'B', pickupAddress: 'Rue Z', startAt };
    const first = await api('/api/bookings', { method: 'POST', token: student, body });
    // Demande dont l'heure de début est passée sans réponse du moniteur.
    await db.run('UPDATE bookings SET start_at = ? WHERE id = ?', new Date(Date.now() - 60000).toISOString(), first.data.booking.id);
    const mine = await api('/api/bookings', { token: student });
    assert.equal(mine.data.bookings.find((x) => x.id === first.data.booking.id).status, 'expired');
    assert.equal((await api('/api/bookings', { method: 'POST', token: student, body })).status, 201);
  });

  test('changement de formule appliqué au renouvellement', async () => {
    const token = (await register('upgrade@test.be')).data.token;
    await api('/api/subscriptions', { method: 'POST', token, body: { planId: 'theorie', category: 'B' } });
    const changed = await api('/api/subscriptions/me/plan', { method: 'POST', token, body: { planId: 'integral' } });
    assert.equal(changed.data.subscription.plan.id, 'theorie');
    assert.equal(changed.data.subscription.remainingMinutes, 0);
    assert.equal(changed.data.subscription.pendingPlan.id, 'integral');

    await db.run(
      'UPDATE subscriptions SET current_period_end = ? WHERE id = ?',
      new Date(Date.now() - 1000).toISOString(),
      changed.data.subscription.id,
    );
    const renewed = await api('/api/subscriptions/me', { token });
    assert.equal(renewed.data.subscription.plan.id, 'integral');
    assert.equal(renewed.data.subscription.remainingMinutes, 360);
    assert.equal(renewed.data.subscription.pendingPlan, null);
  });

  test('base locale : une requête faite pendant une transaction n’est pas annulée avec elle', async () => {
    const local = await openDb(':memory:');
    const failing = local.transaction(async (tx) => {
      await tx.run(`INSERT INTO app_meta (key, value) VALUES ('tx', '1')`);
      await new Promise((resolve) => setTimeout(resolve, 20));
      throw new Error('rollback');
    });
    const outside = local.run(`INSERT INTO app_meta (key, value) VALUES ('outside', '1')`);
    await assert.rejects(failing);
    await outside;
    assert.ok(await local.get(`SELECT 1 FROM app_meta WHERE key = 'outside'`));
    assert.equal(await local.get(`SELECT 1 FROM app_meta WHERE key = 'tx'`), undefined);
    local.close();
  });

  test('démo désactivée par défaut en production', async () => {
    const { demoEnabled } = await import('../src/seed.js');
    assert.equal(demoEnabled({}), true);
    assert.equal(demoEnabled({ VERCEL: '1' }), false);
    assert.equal(demoEnabled({ TURSO_DATABASE_URL: 'libsql://x' }), false);
    assert.equal(demoEnabled({ VERCEL: '1', SEED: '1' }), true);
    assert.equal(demoEnabled({ SEED: '0' }), false);
  });
});

describe('centres d’examen', () => {
  test('liste les 32 centres, filtre par Région et par texte', async () => {
    const all = await api('/api/exam-centers');
    assert.equal(all.data.centers.length, 32);
    const counts = all.data.centers.reduce((acc, c) => ({ ...acc, [c.region]: (acc[c.region] ?? 0) + 1 }), {});
    assert.deepEqual(counts, { bruxelles: 2, wallonie: 14, flandre: 16 });

    const namur = await api('/api/exam-centers?q=namur');
    assert.deepEqual(namur.data.centers.map((c) => c.id), ['suarlee']);
    const accent = await api('/api/exam-centers?q=liege');
    assert.deepEqual(accent.data.centers.map((c) => c.id), ['wandre']);
    const postal = await api('/api/exam-centers?q=9100');
    assert.equal(postal.data.centers[0].city, 'Sint-Niklaas');

    const brussels = await api('/api/exam-centers?region=bruxelles');
    assert.equal(brussels.data.centers.length, 2);
  });

  test('trie par distance depuis une position', async () => {
    const { data } = await api('/api/exam-centers?lat=50.85&lng=4.35');
    assert.equal(data.centers[0].region, 'bruxelles');
    for (let i = 1; i < data.centers.length; i += 1) {
      assert.ok(data.centers[i - 1].distanceKm <= data.centers[i].distanceKm);
    }
    assert.ok(data.centers[0].directionsUrl.startsWith('https://www.google.com/maps/dir/'));
  });
});

describe('démo avec pack', () => {
  test('élève de démo avec un pack Intégral avancé, ajouté une seule fois', async () => {
    const demoDb = await openDb(':memory:');
    await seed(demoDb);
    assert.equal(await seedDemoPack(demoDb), true);
    assert.equal(await seedDemoPack(demoDb), false);

    const student = await demoDb.get('SELECT id FROM users WHERE email = ?', DEMO_PACK_EMAIL);
    const sub = await getActiveSubscription(demoDb, student.id);
    const summary = await serializeSubscription(demoDb, sub);
    assert.equal(summary.plan.id, 'integral');
    assert.equal(summary.remainingMinutes, 120); // 6 h incluses − 2 h faites − 2 h à venir

    const steps = Object.fromEntries((await buildJourney(demoDb, sub)).steps.map((step) => [step.id, step]));
    assert.equal(steps.theory.done, true);
    assert.equal(steps.provisional.done, true);
    assert.ok(steps.driving.detail.startsWith('8 h sur 20 h'));
    assert.equal(steps.exam.done, false);
    demoDb.close();
  });
});

describe('démarrage à froid', () => {
  test('une base déjà prête ne refait ni le schéma ni la démo', async () => {
    const file = join(mkdtempSync(join(tmpdir(), 'autoschub-')), 'cold.db');
    const first = await openDb(file);
    await seedDemo(first);
    first.close();

    const second = await openDb(file);
    assert.equal(second.meta.schema_version !== undefined, true);
    let queries = 0;
    for (const method of ['get', 'all', 'run', 'exec', 'transaction']) {
      const original = second[method];
      second[method] = (...args) => {
        queries += 1;
        return original(...args);
      };
    }
    await seedDemo(second);
    assert.equal(queries, 0);
    assert.ok(await second.get('SELECT 1 FROM users WHERE email = ?', DEMO_PACK_EMAIL));
    second.close();
  });
});

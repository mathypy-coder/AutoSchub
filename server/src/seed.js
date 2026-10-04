import { fileURLToPath } from 'node:url';
import { hashPassword } from './auth.js';
import { openDb } from './db.js';

export const DEMO_PASSWORD = 'demo1234';

const DEMO_INSTRUCTORS = [
  {
    first: 'Sophie', last: 'Lambert', city: 'Bruxelles', lat: 50.8503, lng: 4.3517,
    school: 'Auto-école Grand-Place', categories: ['B', 'BE'], languages: ['fr', 'nl', 'en'],
    transmission: 'les deux', vehicle: 'Peugeot 208 (double commande)', rate: 58, online: true,
    bio: 'Monitrice depuis 12 ans, spécialiste des élèves stressés et de la conduite en ville.',
  },
  {
    first: 'Karim', last: 'Benali', city: 'Ixelles', lat: 50.8333, lng: 4.3667,
    school: 'Indépendant', categories: ['AM', 'A1', 'A2', 'A'], languages: ['fr', 'ar', 'en'],
    transmission: 'manuelle', vehicle: 'Yamaha MT-07 & Honda CB125F', rate: 65, online: true,
    bio: 'Motard passionné, je vous prépare au plateau et à la route en toute sécurité.',
  },
  {
    first: 'Pieter', last: 'Claes', city: 'Gent', lat: 51.0543, lng: 3.7174,
    school: 'Rijschool Gent Centrum', categories: ['B', 'C1', 'C', 'CE'], languages: ['nl', 'fr', 'en'],
    transmission: 'manuelle', vehicle: 'Volkswagen Golf / MAN TGL', rate: 62, online: false,
    bio: 'Ervaren instructeur voor auto en vrachtwagen. Je parle aussi français.',
  },
  {
    first: 'Julie', last: 'Dubois', city: 'Liège', lat: 50.6326, lng: 5.5797,
    school: 'Auto-école de la Meuse', categories: ['B'], languages: ['fr', 'de'],
    transmission: 'automatique', vehicle: 'Toyota Yaris Hybrid (automatique)', rate: 55, online: true,
    bio: 'Formation en boîte automatique, idéale pour un permis rapide et serein.',
  },
  {
    first: 'Marc', last: 'Wauters', city: 'Namur', lat: 50.4674, lng: 4.8718,
    school: 'Namur Conduite', categories: ['B', 'BE', 'G'], languages: ['fr'],
    transmission: 'manuelle', vehicle: 'Renault Clio + remorque / Tracteur John Deere', rate: 52, online: true,
    bio: 'Permis voiture, remorque et tracteur agricole. Ancien agriculteur, je connais la campagne !',
  },
  {
    first: 'Nadia', last: 'Peeters', city: 'Antwerpen', lat: 51.2194, lng: 4.4025,
    school: 'Rijschool Scheldeland', categories: ['B', 'D1', 'D', 'DE'], languages: ['nl', 'en', 'fr'],
    transmission: 'les deux', vehicle: 'Škoda Fabia / Mercedes Sprinter / Van Hool', rate: 70, online: false,
    bio: 'Spécialiste transport de personnes : minibus et autocar.',
  },
  {
    first: 'Thomas', last: 'Leroy', city: 'Charleroi', lat: 50.4108, lng: 4.4446,
    school: 'Auto-école du Pays Noir', categories: ['B', 'C1', 'C1E', 'C', 'CE'], languages: ['fr', 'it'],
    transmission: 'manuelle', vehicle: 'Opel Corsa / DAF XF', rate: 60, online: true,
    bio: 'Poids lourds et voiture. Préparation au CAP et aux examens pratiques.',
  },
  {
    first: 'Elena', last: 'Rossi', city: 'Mons', lat: 50.4542, lng: 3.9523,
    school: 'Mons Moto Academy', categories: ['AM', 'A1', 'A2', 'A', 'B'], languages: ['fr', 'it', 'en'],
    transmission: 'manuelle', vehicle: 'Kawasaki Z650 / Citroën C3', rate: 57, online: false,
    bio: 'Moto et voiture, pédagogie bienveillante et progressive.',
  },
  {
    first: 'Lucas', last: 'Martin', city: 'Etterbeek', lat: 50.8364, lng: 4.3893,
    school: 'Indépendant', categories: ['B'], languages: ['fr', 'en', 'es'],
    transmission: 'manuelle', vehicle: 'Volkswagen Polo (double commande)', rate: 50, online: true,
    bio: 'Jeune moniteur, cours flexibles le soir et le week-end, prise en charge à domicile.',
  },
  {
    first: 'Anke', last: 'Schmitz', city: 'Eupen', lat: 50.6285, lng: 6.0361,
    school: 'Fahrschule Ostbelgien', categories: ['AM', 'B', 'G'], languages: ['de', 'fr'],
    transmission: 'manuelle', vehicle: 'Ford Fiesta / Fendt 312', rate: 54, online: true,
    bio: 'Unterricht auf Deutsch und Französisch in Ostbelgien.',
  },
];

const INSERT_USER = `INSERT INTO users (role, first_name, last_name, email, password_hash, phone, city)
  VALUES (?, ?, ?, ?, ?, ?, ?)`;
const INSERT_INSTRUCTOR = `INSERT INTO instructors (user_id, bio, school_name, approval_number, categories, languages,
  transmission, vehicle, hourly_rate_cents, lat, lng, is_online, rating_sum, rating_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export async function seed(db) {
  const password = hashPassword(DEMO_PASSWORD);

  await db.transaction(async (tx) => {
    await tx.run(INSERT_USER, 'student', 'Emma', 'Janssens', 'eleve@autoschub.be', password, '+32 470 00 00 01', 'Bruxelles');
    for (const [index, m] of DEMO_INSTRUCTORS.entries()) {
      const email = index === 0 ? 'moniteur@autoschub.be' : `${m.first}.${m.last}@autoschub.be`.toLowerCase();
      const { lastInsertRowid } = await tx.run(
        INSERT_USER, 'instructor', m.first, m.last, email, password, `+32 470 10 00 ${String(index).padStart(2, '0')}`, m.city,
      );
      const ratingCount = 8 + ((index * 7) % 30);
      const ratingSum = Math.round(ratingCount * (4.5 + ((index * 3) % 5) / 10));
      await tx.run(
        INSERT_INSTRUCTOR,
        lastInsertRowid, m.bio, m.school, `AGR-${2024000 + index * 137}`, JSON.stringify(m.categories),
        JSON.stringify(m.languages), m.transmission, m.vehicle, m.rate * 100, m.lat, m.lng, m.online ? 1 : 0,
        Math.min(ratingSum, ratingCount * 5), ratingCount,
      );
    }
  });
}

export async function seedIfEmpty(db) {
  const { n } = await db.get('SELECT COUNT(*) AS n FROM users');
  if (n > 0) return;
  try {
    await seed(db);
    console.log(`Données de démo créées (mot de passe : ${DEMO_PASSWORD}).`);
  } catch (err) {
    // Deux instances peuvent démarrer en même temps sur une base vide : une seule gagne.
    if (!/UNIQUE|SQLITE_BUSY|locked/i.test(String(err?.message))) throw err;
  }
}

export const DEMO_PACK_EMAIL = 'eleve.pack@autoschub.be';

const daysFromNow = (days, hour = 10) => {
  const date = new Date(Date.now() + days * 86400000);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};
const sqliteDate = (iso) => iso.slice(0, 19).replace('T', ' ');

/**
 * Élève de démo avec un pack Intégral (permis B) déjà bien avancé : théorie réussie,
 * permis provisoire, leçons passées (notées, avec retours) et une leçon à venir.
 * Ajouté une seule fois, même sur une base existante.
 */
export async function seedDemoPack(db) {
  if (await db.get('SELECT 1 FROM users WHERE email = ?', DEMO_PACK_EMAIL)) return false;
  const sophie = await db.get(`SELECT id FROM users WHERE email = 'moniteur@autoschub.be'`);
  const lucas = await db.get(`SELECT id FROM users WHERE email = 'lucas.martin@autoschub.be'`);
  if (!sophie || !lucas) return false;

  await db.transaction(async (tx) => {
    const { lastInsertRowid: studentId } = await tx.run(
      INSERT_USER, 'student', 'Noah', 'Dubois', DEMO_PACK_EMAIL, hashPassword(DEMO_PASSWORD), '+32 470 00 00 02', 'Bruxelles',
    );

    // Abonnement souscrit il y a 45 jours : on est dans la 2e période mensuelle.
    const createdAt = daysFromNow(-45, 9);
    const periodStart = new Date(Date.parse(createdAt) + 30 * 86400000).toISOString();
    const periodEnd = new Date(Date.parse(periodStart) + 30 * 86400000).toISOString();
    const { lastInsertRowid: subId } = await tx.run(
      `INSERT INTO subscriptions (student_id, plan_id, category, current_period_start, current_period_end,
         provisional_at, created_at)
       VALUES (?, 'integral', 'B', ?, ?, ?, ?)`,
      studentId, periodStart, periodEnd, daysFromNow(-30).slice(0, 10), createdAt,
    );

    // Théorie : un examen blanc raté, puis réussi.
    for (const [days, score, passed] of [[-42, 33, 0], [-38, 42, 1]]) {
      await tx.run(
        `INSERT INTO theory_attempts (user_id, category, mode, score, max_score, correct, total, grave_faults, passed, created_at)
         VALUES (?, 'B', 'exam', ?, 44, ?, 44, ?, ?, ?)`,
        studentId, score, score + (passed ? 1 : 3), passed ? 0 : 2, passed, sqliteDate(daysFromNow(days)),
      );
    }

    // Leçons : [jours, moniteur, tarif €/h, durée, statut, note, retour, période du pack]
    const lessons = [
      [-28, sophie.id, 58, 120, 'completed', 5, 'Bonne prise en main. Travailler les rétroviseurs avant chaque changement de direction.', createdAt],
      [-21, sophie.id, 58, 120, 'completed', 5, 'Démarrages en côte maîtrisés. Prochaine fois : ronds-points.', createdAt],
      [-14, lucas.id, 50, 120, 'completed', 4, 'Ronds-points corrects, attention à la priorité de droite en zone 30.', createdAt],
      [-5, sophie.id, 58, 120, 'completed', 5, 'Très bon trajet en ville. On peut viser l’examen d’ici 3 à 4 leçons.', periodStart],
      [2, sophie.id, 58, 120, 'accepted', null, null, periodStart],
    ];
    for (const [days, instructorId, rate, duration, status, rating, feedback, period] of lessons) {
      await tx.run(
        `INSERT INTO bookings (student_id, instructor_id, category, start_at, duration_min, pickup_address, pickup_lat,
           pickup_lng, status, price_cents, student_price_cents, covered_minutes, subscription_id, subscription_period,
           student_rating, instructor_feedback)
         VALUES (?, ?, 'B', ?, ?, 'Rue de la Loi 16, 1000 Bruxelles', 50.8466, 4.3669, ?, ?, 0, ?, ?, ?, ?, ?)`,
        studentId, instructorId, daysFromNow(days), duration, status, rate * duration * (100 / 60), duration, subId,
        period, rating, feedback,
      );
      if (rating) {
        await tx.run(
          'UPDATE instructors SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE user_id = ?',
          rating, instructorId,
        );
      }
    }
  });
  return true;
}

// Données de démo au démarrage : comptes de base, puis élève avec pack (désactivable avec DEMO_PACK=0).
// Les comptes de démo ont un mot de passe public : activés par défaut en local seulement.
// En production (Vercel ou base Turso), il faut les demander explicitement avec SEED=1.
export function demoEnabled(env = process.env) {
  if (env.SEED === '0') return false;
  if (env.SEED === '1') return true;
  return !env.VERCEL && !env.TURSO_DATABASE_URL;
}

export async function seedDemo(db) {
  if (!demoEnabled()) return;
  const withPack = process.env.DEMO_PACK !== '0';
  // Déjà fait (mémorisé dans la base) : rien à vérifier, démarrage plus rapide.
  const marker = `v1${withPack ? '+pack' : ''}`;
  if (db.meta?.demo_seeded === marker) return;

  await seedIfEmpty(db);
  if (withPack) {
    try {
      if (await seedDemoPack(db)) console.log(`Élève de démo avec pack créé : ${DEMO_PACK_EMAIL}.`);
    } catch (err) {
      if (!/UNIQUE|SQLITE_BUSY|locked/i.test(String(err?.message))) throw err;
    }
  }
  await db.setMeta?.('demo_seeded', marker);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await seedDemo(await openDb());
}

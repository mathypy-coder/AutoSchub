import { fileURLToPath } from 'node:url';
import { hashPassword } from './auth.js';
import { openDb, transaction } from './db.js';

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

export function seed(db) {
  const insertUser = db.prepare(
    `INSERT INTO users (role, first_name, last_name, email, password_hash, phone, city)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertInstructor = db.prepare(
    `INSERT INTO instructors (user_id, bio, school_name, approval_number, categories, languages, transmission,
       vehicle, hourly_rate_cents, lat, lng, is_online, rating_sum, rating_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const password = hashPassword(DEMO_PASSWORD);

  transaction(db, () => {
    insertUser.run('student', 'Emma', 'Janssens', 'eleve@autoschub.be', password, '+32 470 00 00 01', 'Bruxelles');
    DEMO_INSTRUCTORS.forEach((m, index) => {
      const email = index === 0 ? 'moniteur@autoschub.be' : `${m.first}.${m.last}@autoschub.be`.toLowerCase();
      const { lastInsertRowid } = insertUser.run(
        'instructor', m.first, m.last, email, password, `+32 470 10 00 ${String(index).padStart(2, '0')}`, m.city,
      );
      const ratingCount = 8 + ((index * 7) % 30);
      const ratingSum = Math.round(ratingCount * (4.5 + ((index * 3) % 5) / 10));
      insertInstructor.run(
        lastInsertRowid, m.bio, m.school, `AGR-${2024000 + index * 137}`, JSON.stringify(m.categories),
        JSON.stringify(m.languages), m.transmission, m.vehicle, m.rate * 100, m.lat, m.lng, m.online ? 1 : 0,
        Math.min(ratingSum, ratingCount * 5), ratingCount,
      );
    });
  });
}

export function seedIfEmpty(db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (n === 0) {
    seed(db);
    console.log(`Données de démo créées (mot de passe : ${DEMO_PASSWORD}).`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedIfEmpty(openDb());
}

// Les 32 centres d'examen agréés en Belgique (coordonnés par le GOCA).
// Adresses relevées en 2026 ; les coordonnées GPS sont approximatives
// (positionnement sur la carte) — l'itinéraire utilise l'adresse exacte.
// Depuis le 1er janvier 2026, théorie et pratique se passent dans la même Région.
export const OPERATORS = {
  autosecurite: { name: 'Autosécurité', website: 'https://www.autosecurite.be' },
  aibv: { name: 'AIBV', website: 'https://www.aibv.be' },
  autoveiligheid: { name: 'Groep Autoveiligheid', website: 'https://www.autoveiligheid.be' },
  sbat: { name: 'S.B.A.T.', website: 'https://www.sbat.be' },
  km: { name: 'Keuringsbureau Motorvoertuigen (KM)', website: null },
  act: { name: 'Autocontrole (ACT)', website: null },
  lsa: { name: 'La Sécurité Automobile', website: null },
};

export const REGIONS = [
  { id: 'bruxelles', label: 'Bruxelles' },
  { id: 'wallonie', label: 'Wallonie' },
  { id: 'flandre', label: 'Flandre' },
];

export const EXAM_CENTERS = [
  // ——— Bruxelles ———
  { id: 'evere', name: 'Schaerbeek / Evere', operator: 'act', region: 'bruxelles',
    street: 'Rue Colonel Bourg 118', postalCode: '1140', city: 'Evere', phone: '02 726 91 52', lat: 50.853, lng: 4.408 },
  { id: 'anderlecht', name: 'Anderlecht', operator: 'lsa', region: 'bruxelles',
    street: 'Rue du Labeur 3/9', postalCode: '1070', city: 'Anderlecht', lat: 50.826, lng: 4.295 },

  // ——— Wallonie : Autosécurité ———
  { id: 'ottignies', name: 'Ottignies / Louvain-la-Neuve', operator: 'autosecurite', region: 'wallonie',
    street: 'Avenue Albert Einstein 1', postalCode: '1348', city: 'Ottignies-Louvain-la-Neuve', lat: 50.669, lng: 4.629 },
  { id: 'marquain', name: 'Tournai / Marquain', operator: 'autosecurite', region: 'wallonie',
    street: 'Rue du Serpolet 21', postalCode: '7522', city: 'Marquain', lat: 50.608, lng: 3.326 },
  { id: 'cuesmes', name: 'Mons / Cuesmes', operator: 'autosecurite', region: 'wallonie',
    street: 'Rue du Grand Courant 18', postalCode: '7033', city: 'Cuesmes', lat: 50.44, lng: 3.92 },
  { id: 'lobbes', name: 'Lobbes', operator: 'autosecurite', region: 'wallonie',
    street: 'Rue de Binche 9', postalCode: '6540', city: 'Lobbes', lat: 50.352, lng: 4.265 },
  { id: 'suarlee', name: 'Namur / Suarlée', operator: 'autosecurite', region: 'wallonie',
    street: 'Nouvelle Route de Suarlée 23', postalCode: '5020', city: 'Suarlée', phone: '087 57 20 30', lat: 50.487, lng: 4.779 },
  { id: 'huy', name: 'Huy / Tihange', operator: 'autosecurite', region: 'wallonie',
    street: 'Rue Albert Legrand 6', postalCode: '4500', city: 'Huy', lat: 50.532, lng: 5.248 },
  { id: 'wandre', name: 'Liège / Wandre', operator: 'autosecurite', region: 'wallonie',
    street: 'Avenue de l’Indépendance 103', postalCode: '4020', city: 'Wandre', lat: 50.668, lng: 5.656 },
  { id: 'lontzen', name: 'Eupen / Lontzen', operator: 'autosecurite', region: 'wallonie',
    street: 'Campusstraße 10', postalCode: '4710', city: 'Lontzen', lat: 50.64, lng: 6.0 },
  { id: 'marche', name: 'Marche-en-Famenne', operator: 'autosecurite', region: 'wallonie',
    street: 'Rue du Parc Industriel 35', postalCode: '6900', city: 'Marche-en-Famenne', lat: 50.215, lng: 5.32 },
  { id: 'bastogne', name: 'Bastogne', operator: 'autosecurite', region: 'wallonie',
    street: 'Rue du Marché Couvert 22', postalCode: '6600', city: 'Bastogne', lat: 50.005, lng: 5.73 },
  { id: 'arlon', name: 'Arlon', operator: 'autosecurite', region: 'wallonie',
    street: 'Zoning Artisanal de Weyler 26', postalCode: '6706', city: 'Arlon', lat: 49.665, lng: 5.8 },

  // ——— Wallonie : AIBV ———
  { id: 'braine-le-comte', name: 'Braine-le-Comte', operator: 'aibv', region: 'wallonie',
    street: 'Avenue du Marouset 103', postalCode: '7090', city: 'Braine-le-Comte', phone: '067 55 55 62', lat: 50.615, lng: 4.15 },
  { id: 'couillet', name: 'Charleroi / Couillet', operator: 'aibv', region: 'wallonie',
    street: 'Rue du Lion Belge 7', postalCode: '6010', city: 'Couillet', phone: '071 47 65 35', lat: 50.39, lng: 4.465 },
  { id: 'mariembourg', name: 'Mariembourg', operator: 'aibv', region: 'wallonie',
    street: 'Rue Duc Saint Simon 17', postalCode: '5660', city: 'Mariembourg', phone: '060 31 13 34', lat: 50.095, lng: 4.51 },

  // ——— Flandre : Groep Autoveiligheid ———
  { id: 'deurne', name: 'Antwerpen / Deurne', operator: 'autoveiligheid', region: 'flandre',
    street: 'Santvoortbeeklaan 34', postalCode: '2100', city: 'Deurne', lat: 51.22, lng: 4.465 },
  { id: 'geel', name: 'Geel', operator: 'autoveiligheid', region: 'flandre',
    street: 'Lammerdries 7', postalCode: '2440', city: 'Geel', lat: 51.165, lng: 4.955 },
  { id: 'kontich', name: 'Kontich', operator: 'autoveiligheid', region: 'flandre',
    street: 'Neerveld 3a', postalCode: '2550', city: 'Kontich', lat: 51.13, lng: 4.44 },
  { id: 'alken', name: 'Alken', operator: 'autoveiligheid', region: 'flandre',
    street: 'Industrieterrein Kolmen 1216', postalCode: '3570', city: 'Alken', lat: 50.895, lng: 5.29 },
  { id: 'bree', name: 'Bree', operator: 'autoveiligheid', region: 'flandre',
    street: 'Industrieterrein Peerderbaan 1305, Toekomststraat', postalCode: '3960', city: 'Bree', lat: 51.15, lng: 5.58 },
  { id: 'haasrode', name: 'Leuven / Haasrode', operator: 'autoveiligheid', region: 'flandre',
    street: 'Ambachtenlaan 10', postalCode: '3001', city: 'Haasrode', lat: 50.835, lng: 4.73 },

  // ——— Flandre : S.B.A.T. ———
  { id: 'sint-denijs-westrem', name: 'Gent / Sint-Denijs-Westrem', operator: 'sbat', region: 'flandre',
    street: 'Poortakkerstraat 131', postalCode: '9051', city: 'Sint-Denijs-Westrem', lat: 51.025, lng: 3.68 },
  { id: 'eeklo', name: 'Eeklo', operator: 'sbat', region: 'flandre',
    street: 'Industrielaan 15', postalCode: '9900', city: 'Eeklo', lat: 51.19, lng: 3.58 },
  { id: 'brakel', name: 'Brakel', operator: 'sbat', region: 'flandre',
    street: 'Industrielaan 8', postalCode: '9660', city: 'Brakel', lat: 50.795, lng: 3.77 },
  { id: 'erembodegem', name: 'Aalst / Erembodegem', operator: 'sbat', region: 'flandre',
    street: 'Bedrijventerrein Zuid III, Industrielaan 26', postalCode: '9320', city: 'Erembodegem', lat: 50.92, lng: 4.06 },
  { id: 'sint-niklaas', name: 'Sint-Niklaas', operator: 'sbat', region: 'flandre',
    street: 'Oostjachtpark 8', postalCode: '9100', city: 'Sint-Niklaas', lat: 51.17, lng: 4.17 },

  // ——— Flandre : KM ———
  { id: 'brugge', name: 'Brugge', operator: 'km', region: 'flandre',
    street: 'Monnikenwerve 204', postalCode: '8000', city: 'Brugge', lat: 51.23, lng: 3.205 },
  { id: 'oostende', name: 'Oostende', operator: 'km', region: 'flandre',
    street: 'Zandvoordestraat 442', postalCode: '8400', city: 'Oostende', lat: 51.2, lng: 2.95 },
  { id: 'roeselare', name: 'Roeselare', operator: 'km', region: 'flandre',
    street: 'Brugsesteenweg 366', postalCode: '8800', city: 'Roeselare', lat: 50.96, lng: 3.115 },
  { id: 'wevelgem', name: 'Wevelgem', operator: 'km', region: 'flandre',
    street: 'Noordstraat 3', postalCode: '8560', city: 'Wevelgem', lat: 50.81, lng: 3.18 },

  // ——— Flandre : AIBV ———
  { id: 'asse', name: 'Asse / Mollem', operator: 'aibv', region: 'flandre',
    street: 'Industriezone Z.5 Mollem 81', postalCode: '1730', city: 'Mollem', phone: '02 452 99 37', lat: 50.93, lng: 4.215 },
];

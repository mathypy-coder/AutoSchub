import sys, datetime
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
import fplib as F
from fplib import EUR, EUR2, PCT, NUM, NUM1, NUM2, L, FIRST, NM, LASTM
from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.styles import Alignment

OUT = sys.argv[1] if len(sys.argv) > 1 else 'AutoSchub_plan_financier_app.xlsx'
SCEN = int(sys.argv[2]) if len(sys.argv) > 2 else 2
GRID = int(sys.argv[3]) if len(sys.argv) > 3 else 1
B2B = [0, 15, 35, 55, 70] if (len(sys.argv) > 4 and sys.argv[4] == '1') else [0, 0, 0, 0, 0]
COMM = float(sys.argv[5]) if len(sys.argv) > 5 else 0.20
LEG = len(sys.argv) > 6 and sys.argv[6] == '1'
RATE, PTH, PCO, PIN = (58, 9.99, 149, 279) if LEG else (75, 14.99, 219, 429)
CAPOP, CAPOT = ([0] * 5, [0] * 5) if LEG else ([0.02, 0.05, 0.08, 0.10, 0.12], [0.01, 0.03, 0.05, 0.06, 0.07])

wb = Workbook()
wb.remove(wb.active)
F.REG.clear()

readme = wb.create_sheet('Lisez-moi')
synth_ws = wb.create_sheet('Synthèse')

H = F.Hyp(wb, 'Hypothèses', 'AutoSchub — hypothèses du plan financier (application)',
          'Cellules bleues = hypothèses modifiables ; fond jaune = hypothèses clés ; noir = calculs. Montants en euros. '
          'Recherche effectuée le 04/11/2026.')

# ------------------------------------------------------------------ GÉNÉRAL
H.section('1. Paramètres généraux')
H.add('start', 'Date de démarrage du plan (mois 1)', datetime.date(2027, 1, 1), 'date',
      'Lancement commercial visé : janvier 2027 (constitution de la SRL en décembre 2026).', 'mmm-yy')
H.add('scenario', 'Scénario actif (1 = prudent, 2 = central, 3 = ambitieux)', SCEN, 'choix',
      'Pilote les multiplicateurs de la section 4.', '0', key_flag=True)
H.add('grid', 'Grille tarifaire des packs (1 = grille 2027 alignée sur les auto-écoles, 2 = pack scindé recommandé)', GRID, 'choix',
      '1 = packs revalorisés (14,99 / 219 / 429 €), vendus au nom d’AutoSchub ; 2 = pack scindé (abonnement de service + crédits d’heures vendus au nom des moniteurs). Voir onglet « Unit economics ».',
      '0', key_flag=True)
H.add('tva', 'Taux de TVA normal', 0.21, '%', 'Code TVA belge, taux normal 21 %.', PCT)

# ------------------------------------------------------------------ MARCHÉ
H.section('2. Marché adressable — Wallonie + Bruxelles (permis B)')
H.add('w_th', 'Examens théoriques B passés en Wallonie / an', 152005, 'examens',
      'Annexe Parlement wallon 06/02/2026 (données 2025), reprise par permis.online/observatoire et BX1 (intitulés corrigés).', NUM)
H.add('w_th_rate', 'Taux de réussite théorique Wallonie', 0.37, '%', 'Idem (37 % en 2025 ; 34-35 % historiquement).', PCT)
H.add('b_th', 'Examens théoriques B passés à Bruxelles / an', 53721, 'examens',
      'Réponses parlementaires bruxelloises 2025 (données 2024).', NUM)
H.add('b_th_rate', 'Taux de réussite théorique Bruxelles', 0.41, '%', 'Idem (41 % en 2024).', PCT)
H.add('w_pr', 'Examens pratiques B en Wallonie / an', 87162, 'examens', 'Annexe Parlement wallon 06/02/2026 (2025).', NUM)
H.add('w_pr_rate', 'Taux de réussite pratique Wallonie', 0.54, '%', 'Idem (54 % en 2025).', PCT)
H.add('b_pr', 'Examens pratiques B à Bruxelles / an', 21000, 'examens', 'BX1 / Bruxelles Mobilité : « un peu plus de 21 000 » (2024).', NUM)
H.add('b_pr_rate', 'Taux de réussite pratique Bruxelles', 0.51, '%', 'Bruxelles Mobilité : 51 % (2024).', PCT)
H.calc('mkt_base', 'Candidats entrant en formation pratique / an (= réussites théoriques W+B)',
       '<w_th>*<w_th_rate>+<b_th>*<b_th_rate>', 'élèves',
       'Calcul : ≈ 56 200 (Wallonie) + 22 000 (Bruxelles). Base de la demande de leçons et de packs.', NUM)
H.calc('mkt_lic', 'Permis B pratiques réussis / an (W+B) — indicateur', '<w_pr>*<w_pr_rate>+<b_pr>*<b_pr_rate>', 'permis',
       'Calcul : ≈ 47 100 + 10 700. Les autres catégories (A, C, D, G) ne sont pas valorisées (prudence).', NUM)
H.add('mkt_growth', 'Croissance annuelle du nombre de candidats', [0, 0.01, 0.01, 0.01, 0.01], '%/an',
      'Hypothèse prudente : démographie 17-25 ans stable, légère hausse liée aux réformes (accès direct 30 h).', PCT)

# ------------------------------------------------------------------ ADOPTION
H.section('3. Adoption et comportement des élèves')
H.add('adoption', 'Part des nouveaux candidats qui s’inscrivent sur AutoSchub', [0.015, 0.045, 0.08, 0.115, 0.14], '%',
      'Hypothèse : 1,5 % la 1re année (≈ 1 170 inscrits) puis montée progressive. Ordre de grandeur des places de marché locales en phase de lancement.',
      PCT, key_flag=True)
H.add('ramp_months', 'Montée en charge du lancement (mois pour atteindre 100 %)', 6, 'mois',
      'Soft launch : Bruxelles + Liège/Namur/Charleroi puis le reste de la Wallonie.', NUM)
H.add('mix_th', 'Part des inscrits qui prennent le pack Théorie (9,99 €)', 0.30, '%',
      'Hypothèse. Alternative gratuite : 2 examens blancs/semaine (FREE_EXAMS_PER_WEEK = 2).', PCT, key_flag=True)
H.add('mix_co', 'Part des inscrits qui prennent le pack Conduite (149 €)', 0.08, '%', 'Hypothèse (pack « populaire » dans l’app).', PCT, key_flag=True)
H.add('mix_in', 'Part des inscrits qui prennent le pack Intégral (279 €)', 0.04, '%', 'Hypothèse.', PCT, key_flag=True)
H.add('mix_alc', 'Part des inscrits qui réservent des leçons à la carte (sans pack conduite)', 0.30, '%', 'Hypothèse.', PCT, key_flag=True)
H.add('dur_th', 'Durée moyenne d’abonnement Théorie', 2, 'mois', 'Préparation de l’examen théorique : 1 à 3 mois.', NUM1)
H.add('dur_co', 'Durée moyenne d’abonnement Conduite', 4, 'mois', 'TARGET_HOURS B = 20 h ; 3 h/mois incluses + heures supplémentaires.', NUM1)
H.add('dur_in', 'Durée moyenne d’abonnement Intégral', 4, 'mois', '6 h/mois incluses : 20-24 h en ~4 mois.', NUM1)
H.add('dur_alc', 'Durée moyenne d’activité d’un élève « à la carte »', 5, 'mois', 'Hypothèse.', NUM1)
H.add('dur_free', 'Durée moyenne d’activité d’un utilisateur gratuit', 3, 'mois', 'Hypothèse (théorie gratuite).', NUM1)
H.add('h_alc', 'Heures de conduite réservées / mois / élève à la carte', 3, 'h', 'Soit ~15 h par élève sur la plateforme (20 h minimum en filière école).', NUM1)
H.add('lesson_len', 'Durée moyenne d’une leçon', 1.5, 'h', 'Seed : leçons de 60 à 120 min.', NUM1)
H.add('util', 'Taux d’utilisation des heures incluses dans les packs', 0.85, '%',
      'Hypothèse : 15 % d’heures non consommées (vacances, examens, abandon).', PCT, key_flag=True)
H.add('x_co', 'Heures supplémentaires / mois / abonné Conduite', 1.0, 'h', 'Hypothèse (-10 % sur ces heures).', NUM1)
H.add('x_in', 'Heures supplémentaires / mois / abonné Intégral', 0.5, 'h', 'Hypothèse (-15 % sur ces heures).', NUM1)
H.lst('season', ['Saisonnalité — janvier', 'Saisonnalité — février', 'Saisonnalité — mars', 'Saisonnalité — avril',
                 'Saisonnalité — mai', 'Saisonnalité — juin', 'Saisonnalité — juillet', 'Saisonnalité — août',
                 'Saisonnalité — septembre', 'Saisonnalité — octobre', 'Saisonnalité — novembre', 'Saisonnalité — décembre'],
      [0.9, 0.9, 1.0, 1.0, 1.0, 1.1, 1.3, 1.3, 1.0, 0.9, 0.8, 0.8], 'coef.',
      'Pic d’été (fin de secondaire, 18 ans, vacances) ; somme des coefficients = 12.', NUM2)

# ------------------------------------------------------------------ SCÉNARIOS
H.section('4. Scénarios (B = prudent, C = central, D = ambitieux ; F = valeur retenue)')
H.scen('scen_adopt', 'Multiplicateur d’adoption', [0.6, 1.0, 1.35], 'x', 'Appliqué à la part d’inscrits.')
H.scen('scen_conv', 'Multiplicateur de conversion payante', [0.8, 1.0, 1.15], 'x', 'Appliqué aux parts de packs et de leçons.')
H.scen('scen_cac', 'Multiplicateur du coût d’acquisition (CAC)', [1.3, 1.0, 0.85], 'x', 'Appliqué au CAC élève.')

# ------------------------------------------------------------------ PRIX
H.section('5. Prix, commission et paiements (paramètres de l’application)')
H.add('rate', 'Tarif horaire moyen d’une leçon (prix payé par l’élève, TTC)', RATE, '€/h',
      'Aligné sur les auto-écoles agréées actuelles : forfait 20 h médian ≈ 1 647 € en Wallonie (≈ 75-80 €/h), heure sup. médiane ≈ 70 €, à la carte ≈ 81 € (toutpourmonpermis.be, monautoecole.be). Même prix que l’auto-école du groupe (plan 2). Ancien seed : 58 €.',
      EUR2, key_flag=True)
H.add('rate_idx', 'Indexation annuelle du tarif horaire', 0.025, '%/an', 'Inflation services + hausse carburant 2026.', PCT)
H.add('comm', 'Commission plateforme sur les leçons', COMM, '%', 'COMMISSION_RATE = 0.2 (server/src/routes/instructors.js).', PCT, key_flag=True)
H.add('assuj', 'Part des moniteurs assujettis à la TVA (prix TTC)', 0.70, '%',
      'Hypothèse : un moniteur à temps plein dépasse la franchise TVA de 25 000 €/an. La TVA facturée par les assujettis est déductible par AutoSchub.', PCT)
H.calc('cost_factor', 'Facteur de coût HTVA d’1 € versé aux moniteurs', '1-<assuj>*(1-1/(1+<tva>))', 'x',
       'Calcul : part non récupérable de ce qui est versé aux moniteurs.', NUM2)
H.add('p_idx', 'Indexation annuelle des prix des packs', 0.02, '%/an', 'Hypothèse (à partir de l’an 2).', PCT)
H.add('p_th', 'Pack Théorie — prix mensuel TTC', PTH, '€/mois', 'Revalorisé (app actuelle : 9,99 €). Reste sous les applis de théorie payantes (≈ 15-30 €).', EUR2, key_flag=True)
H.add('p_co', 'Pack Conduite — prix mensuel TTC (grille 2027)', PCO, '€/mois', 'Revalorisé (app actuelle : 149 €) : 3 h ≈ 73 €/h, juste sous le prix auto-école (75 €/h), + suivi et théorie illimitée.', EUR2, key_flag=True)
H.add('p_in', 'Pack Intégral — prix mensuel TTC (grille 2027)', PIN, '€/mois', 'Revalorisé (app actuelle : 279 €) : 6 h ≈ 71,5 €/h + moniteur référent.', EUR2, key_flag=True)
H.add('min_co', 'Minutes de conduite incluses — Conduite', 180, 'min', 'plans.js : includedMinutes 180.', NUM)
H.add('min_in', 'Minutes de conduite incluses — Intégral', 360, 'min', 'plans.js : includedMinutes 360.', NUM)
H.add('d_co', 'Réduction heures supplémentaires — Conduite', 0.10, '%', 'plans.js : discount 0.1.', PCT)
H.add('d_in', 'Réduction heures supplémentaires — Intégral', 0.15, '%', 'plans.js : discount 0.15.', PCT)
H.add('fee_co', 'Grille recommandée — abonnement de service Conduite (TTC)', 19.99, '€/mois',
      'Recommandation : suivi, théorie illimitée, rappels. Les heures sont vendues en crédits au nom des moniteurs (seule la marge est soumise à TVA chez AutoSchub).', EUR2)
H.add('fee_in', 'Grille recommandée — abonnement de service Intégral (TTC)', 29.99, '€/mois', 'Idem + moniteur référent.', EUR2)
H.calc('disp_co', 'Grille recommandée — prix affiché Conduite (service + 3 h à -10 %)', '<fee_co>+<min_co>/60*<rate>*(1-<d_co>)', '€/mois', 'Calcul (an 1).', EUR2)
H.calc('disp_in', 'Grille recommandée — prix affiché Intégral (service + 6 h à -15 %)', '<fee_in>+<min_in>/60*<rate>*(1-<d_in>)', '€/mois', 'Calcul (an 1).', EUR2)
H.add('b2b_n', 'Écoles de conduite partenaires abonnées (option B2B)', B2B, 'écoles',
      'Levier non activé dans le scénario de base (non codé dans l’app). Ex. : 10 / 25 / 40 écoles.', NUM)
H.add('b2b_fee', 'Abonnement mensuel école partenaire (HTVA)', 79, '€/mois', 'Option : visibilité + outil de planning.', EUR)
H.add('fee_pct', 'Frais de paiement — part variable', 0.014, '%',
      'Mollie Bancontact : 1,40 % + 0,25 € par transaction (mollie.com/payments/bancontact). Prélèvement SEPA pour les renouvellements.', PCT)
H.add('fee_fix', 'Frais de paiement — part fixe par transaction', 0.25, '€', 'Idem.', EUR2)

# ------------------------------------------------------------------ OFFRE MONITEURS
H.section('5 bis. Heures obligatoires après échec (données par l’auto-école du groupe et les écoles partenaires)')
H.note('Après 2 échecs à l’examen pratique : 6 h de cours obligatoires en école agréée ; après 2 échecs à l’examen théorique : 12 h de cours théoriques.')
H.calc('w_pr_pass', 'Réussites à l’examen pratique / an — Wallonie', '<w_pr>*<w_pr_rate>', 'candidats', 'Calcul (2025) : 87 162 × 54 %. Chaque candidat finit par réussir (hypothèse).', NUM)
H.calc('b_pr_pass', 'Réussites à l’examen pratique / an — Bruxelles', '<b_pr>*<b_pr_rate>', 'candidats', 'Calcul (2024) : 21 000 × 51 %.', NUM)
H.calc('oblig_p_mkt', 'Candidats soumis aux 6 h obligatoires / an (2 échecs pratiques)',
       '<w_pr_pass>*(1-<w_pr_rate>)^2+<b_pr_pass>*(1-<b_pr_rate>)^2', 'candidats',
       'Calcul : probabilité d’échouer 2 fois = (1 − taux de réussite)² → ≈ 10 000 (W) + 2 600 (B).', NUM)
H.calc('oblig_t_mkt', 'Candidats soumis aux 12 h de théorie obligatoires / an (2 échecs théoriques)',
       '<w_th>*<w_th_rate>*(1-<w_th_rate>)^2+<b_th>*<b_th_rate>*(1-<b_th_rate>)^2', 'candidats',
       'Calcul : ≈ 22 300 (W) + 7 700 (B). Obligation confirmée à Bruxelles ; à vérifier pour la Wallonie (le taux de captation la pondère).', NUM)
H.add('cap_op', 'Part captée des 6 h obligatoires (pratique)', CAPOP, '%',
      'L’app propose les 6 h dans l’auto-école du groupe dès le 2e échec (notification, réservation immédiate) ; écoles partenaires au-delà de sa capacité.', PCT, key_flag=True)
H.add('cap_ot', 'Part captée des 12 h obligatoires (théorie)', CAPOT, '%', 'Cours en salle dans l’auto-école du groupe.', PCT, key_flag=True)
H.add('oblig_h', 'Heures pratiques obligatoires par candidat', 6, 'h', 'Réglementation régionale (après 2 échecs pratiques).', NUM)
H.add('extra_h_oblig', 'Heures supplémentaires achetées en plus des 6 h', 2, 'h', 'Hypothèse : préparation du 3e passage.', NUM1)
H.add('p_thcourse', 'Prix des 12 h de théorie obligatoires (TTC)', 180, '€', 'Prix de marché des cours théoriques en école (150-250 €).', EUR)
H.add('comm_oblig', 'Commission AutoSchub sur ces heures', 0.20, '%', 'Même commission que les leçons (facturée à l’auto-école).', PCT)
H.add('cac_oblig', 'Coût d’acquisition d’un candidat en échec', 6, '€', 'Faible : candidats déjà inscrits dans l’app ou ciblés après le résultat d’examen.', EUR)

H.section('6. Réseau de moniteurs')
H.add('h_per_instr', 'Heures vendues via AutoSchub / moniteur actif / mois', 45, 'h', 'Hypothèse : ~1/3 de l’activité d’un moniteur passe par l’app.', NUM)
H.add('instr_churn', 'Attrition mensuelle des moniteurs', 0.03, '%/mois', 'Hypothèse.', PCT)
H.add('onb_cost', 'Coût d’acquisition + vérification d’un moniteur (HTVA)', 180, '€',
      'Contrôle du brevet / autorisation d’enseigner, casier 596.1, assurance, kit de démarrage, publicité ciblée.', EUR)

# ------------------------------------------------------------------ CHARGES
H.section('7. Charges d’exploitation (montants mensuels HTVA sauf mention)')
H.add('cac', 'Coût d’acquisition par élève inscrit (CAC)', [14, 12, 11, 10, 9], '€/inscrit',
      'Hypothèse : réseaux sociaux (TikTok/Instagram/Meta), SEA, ambassadeurs en écoles secondaires ; baisse avec le bouche-à-oreille.', EUR, key_flag=True)
H.add('mkt_fix', 'Marketing fixe (contenus, marque, salons, écoles)', [1000, 2000, 2500, 3000, 3500], '€/mois', 'Hypothèse.', EUR)
H.add('host_fix', 'Hébergement & infrastructure fixe (Vercel, Turso, cartes, e-mails)', [150, 300, 500, 700, 900], '€/mois',
      'Vercel Pro + Turso + OpenStreetMap tiles/géocodage + e-mails transactionnels. Autoliquidation TVA (fournisseurs hors BE).', EUR)
H.add('host_per_user', 'Coût d’infrastructure variable par utilisateur actif', 0.03, '€/MAU', 'Hypothèse.', EUR2)
H.add('saas', 'Logiciels SaaS (Google Workspace, outils dev, support, CRM)', [250, 400, 600, 800, 1000], '€/mois', 'Hypothèse ; autoliquidation TVA.', EUR)
H.add('compta', 'Expert-comptable & secrétariat social', [450, 500, 600, 700, 800], '€/mois', 'Fourchette marché PME/start-up.', EUR)
H.add('legal_init', 'Juridique de lancement (CGU, RGPD, contrats moniteurs, avis réglementaire)', 6000, '€',
      'Ponctuel au mois 1. Prioritaire : avis sur le cadre « école de conduite agréée » et sur la TVA des packs.', EUR)
H.add('legal_m', 'Juridique récurrent / DPO externalisé', [200, 250, 300, 350, 400], '€/mois', 'Hypothèse.', EUR)
H.add('constit', 'Frais de constitution de la SRL (notaire, publication, BCE, guichet)', 1500, '€', 'Ponctuel au mois 1.', EUR)
H.add('insur', 'Assurances (RC pro, cyber, RC plateforme)', [150, 200, 250, 300, 350], '€/mois', 'Exonérées de TVA (taxe sur les assurances incluse).', EUR)
H.add('office', 'Bureaux (coworking puis bureau)', [300, 600, 1200, 1500, 1800], '€/mois', 'Coworking Bruxelles/Namur puis bureau.', EUR)
H.add('travel', 'Déplacements, événements, frais divers', [250, 300, 400, 500, 600], '€/mois', 'Hypothèse.', EUR)
H.add('telecom', 'Télécom & matériel courant', [100, 150, 200, 250, 300], '€/mois', 'Hypothèse.', EUR)
H.add('bank', 'Frais bancaires', [30, 40, 50, 60, 70], '€/mois', 'Exonérés de TVA.', EUR)
H.add('unexp', 'Provision pour imprévus (% des charges ci-dessus)', 0.05, '%', 'Prudence.', PCT)

# ------------------------------------------------------------------ PERSONNEL
H.section('8. Personnel')
H.add('nb_fdr', 'Nombre de fondateurs (dirigeants indépendants)', 2, 'pers.', 'Hypothèse : CEO + CTO.', NUM)
H.add('fdr_cost', 'Rémunération de dirigeant par fondateur (coût société)', [2000, 3500, 4500, 5000, 5500], '€/mois',
      'Cotisations sociales d’indépendant (20,5 %, min. ~890 €/trim.) à charge du dirigeant. Seuil ISOC taux réduit : 50 000 €/an (sinon rémunération ≥ bénéfice).',
      EUR, key_flag=True)
H.add('onss', 'Cotisations patronales ONSS', 0.25, '%', '≈ 25 % secteur marchand (myfid.be, 2026).', PCT)
H.add('mult13', 'Mois payés par an (13e mois + double pécule)', 13.92, 'mois', 'Usage belge employés.', NUM2)
H.add('benefits', 'Avantages & frais par ETP (chèques-repas, assurance AT, médecine du travail)', 220, '€/mois', 'Hypothèse.', EUR)
H.add('sal_idx', 'Indexation annuelle des salaires', 0.02, '%/an', 'Indexation automatique (hypothèse).', PCT)
H.add('red1', 'Réduction ONSS 1er travailleur (par trimestre, sans limite de durée)', 2000, '€/trim.',
      'Securex / Partena : 2 000 €/trim. à partir du 01/07/2026.', EUR)
H.add('red25', 'Réduction ONSS travailleurs 2 à 5 (par trimestre, 12 trimestres)', 1000, '€/trim.', 'Idem.', EUR)

ROLES = [
    ('Développeur·se full-stack senior', 7, 4500, 1),
    ('Responsable réseau moniteurs & écoles partenaires', 10, 3300, 1),
    ('Chargé·e de support & opérations', 19, 2700, 1),
    ('Growth marketer', 25, 3600, 1),
    ('Développeur·se mobile / full-stack', 31, 4200, 1),
    ('Business developer B2B (écoles, Forem, Actiris, mutualités)', 43, 3500, 1),
]
ROLES.sort(key=lambda x: x[1])
H.r += 1
ws = H.ws
for i, h in enumerate(['Plan de recrutement (salariés)', 'Mois d’entrée', 'Brut mensuel', 'ETP', 'Rang', '', '', 'Commentaire']):
    c = ws.cell(row=H.r, column=i + 1, value=h)
    c.font = F.F_HDR
    c.fill = F.FILL_HDR
H.r += 1
role_r0 = H.r
for k, (n, m, g, e) in enumerate(ROLES):
    ws.cell(row=H.r, column=1, value=n).font = F.F_TXT
    for col, v, fmt in ((2, m, NUM), (3, g, EUR), (4, e, NUM1), (5, k + 1, NUM)):
        c = ws.cell(row=H.r, column=col, value=v)
        c.font = F.F_IN if col < 5 else F.F_CALC
        c.number_format = fmt
    H.r += 1
role_r1 = H.r - 1
ws.cell(row=role_r0, column=8, value='Brut mensuel de l’an 1 (indexé ensuite). Salaires : Indeed BE full-stack ≈ 4 200 €/mois ; rang = ordre d’embauche pour les réductions ONSS.').font = F.F_SUB

# ------------------------------------------------------------------ INVESTISSEMENTS
H.section('9. Investissements')
H.add('dev_budget', 'Mise en production v1 (paiements Mollie, apps iOS/Android, audit sécurité, RGPD)', 30000, '€ HTVA',
      'Prestataires externes ≈ 60 j × 500 €/j (TJM BE 450-850 €). Activé en immobilisation incorporelle, amorti sur 3 ans.', EUR, key_flag=True)
H.add('dev_start', 'Mois de début du chantier v1', 2, 'mois', '', NUM)
H.add('dev_months', 'Durée du chantier v1', 4, 'mois', '', NUM)
H.add('it_cost', 'Matériel informatique par nouvel arrivant (fondateurs inclus)', 1600, '€ HTVA', 'Amorti sur 3 ans.', EUR)
H.add('brand', 'Dépôt de marque Benelux (OBPI) + nom de domaine', 600, '€', 'Mois 1, amorti sur 3 ans.', EUR)

# ------------------------------------------------------------------ FINANCEMENT
H.section('10. Financement')
H.add('cap', 'Apport en capital des fondateurs', 30000, '€', 'Libéré à la constitution (mois 1). Pas de capital minimum en SRL, mais capitaux propres « suffisants » (art. 5:3 CSA).', EUR, key_flag=True)
H.add('seed', 'Levée de fonds seed (business angels / tax shelter 45 %)', 200000, '€',
      'Tax shelter start-up : réduction IPP de 45 % (micro-entreprise) pour l’investisseur, plafond 100 000 €/an (SPF Finances). Possible via plateforme de crowdfunding FSMA.',
      EUR, key_flag=True)
H.add('seed_m', 'Mois de la levée seed', 9, 'mois', 'Après traction mesurable (6 mois de lancement).', NUM)
H.add('seed2', 'Deuxième levée (seed+ / série A)', 0, '€', 'Non nécessaire dans le scénario central ; à activer (≈ 700 000 €) si le scénario prudent se confirme ou pour accélérer (Flandre, autres permis).', EUR, key_flag=True)
H.add('seed2_m', 'Mois de la deuxième levée', 27, 'mois', 'Après 2 ans d’historique (KPIs de rétention et de liquidité).', NUM)
H.add('l1_amt', 'Prêt 1 — prêt subordonné régional (Wallonie Entreprendre / finance&invest.brussels)', 75000, '€',
      'Wallonie Entreprendre : prêts starter jusqu’à 100 000 € ; finance&invest.brussels : prêts proxi / subordonnés. Montant à négocier.', EUR)
H.add('l1_m', 'Prêt 1 — mois de versement', 2, 'mois', '', NUM)
H.add('l1_dur', 'Prêt 1 — durée totale', 60, 'mois', '', NUM)
H.add('l1_grace', 'Prêt 1 — franchise de remboursement du capital', 12, 'mois', '', NUM)
H.add('l1_rate', 'Prêt 1 — taux annuel', 0.045, '%', 'Hypothèse (taux réduit public).', PCT)
H.add('l2_amt', 'Prêt 2 — crédit bancaire avec garantie régionale (75 %)', 50000, '€', 'Garantie Wallonie Entreprendre jusqu’à 75 % du crédit bancaire.', EUR)
H.add('l2_m', 'Prêt 2 — mois de versement', 2, 'mois', '', NUM)
H.add('l2_dur', 'Prêt 2 — durée totale', 48, 'mois', '', NUM)
H.add('l2_grace', 'Prêt 2 — franchise de remboursement du capital', 6, 'mois', '', NUM)
H.add('l2_rate', 'Prêt 2 — taux annuel', 0.055, '%', 'Hypothèse (taux bancaire PME 2026).', PCT)
H.add('sub', 'Subsides d’exploitation (chèques-entreprises : conseil & création)', 5000, '€',
      'Chèques-entreprises wallons (prise en charge 75-90 % de prestations labellisées). Innoviris : pas de nouveaux projets financés en 2026 → non retenu.', EUR)
H.add('sub_m', 'Mois d’encaissement des subsides', 6, 'mois', '', NUM)

# ------------------------------------------------------------------ FISCALITÉ
H.section('11. Fiscalité')
H.add('isoc_low', 'ISOC — taux réduit PME (première tranche)', 0.20, '%', '20 % sur les 100 000 premiers euros (conditions PME + rémunération dirigeant).', PCT)
H.add('isoc_thr', 'ISOC — plafond de la tranche à taux réduit', 100000, '€', '', EUR)
H.add('isoc_std', 'ISOC — taux normal', 0.25, '%', '', PCT)
H.add('isoc_red_ok', 'Taux réduit applicable (1 = oui, 0 = non)', 1, 'choix',
      'Vérifier chaque année la rémunération minimale du dirigeant (50 000 €/an ou ≥ bénéfice imposable).', '0')
H.add('isoc_pay_m', 'Mois de paiement de l’ISOC de l’année précédente', 9, 'mois', 'Simplification (enrôlement l’année suivante, pas de versements anticipés).', NUM)

START = H.ref('start')

# ================================================================== ACTIVITÉ
A = F.MonthlySheet(wb, 'Activité', 'Activité — élèves, abonnés, heures de conduite, moniteurs',
                   'Calculs mensuels sur 60 mois ; colonnes C-G = totaux ou valeurs de fin d’année.', H, START)
A.section('Demande')
A.row('mkt', 'Candidats entrant en formation pratique (rythme annuel)', '<mkt_base>*(1+<<mkt_growth>>)^({Y}-1)', NUM, 'avg', 'élèves/an')
A.row('season', 'Coefficient saisonnier', H.lref('season', '{M}'), NUM2, 'avg', 'coef.')
A.row('ramp', 'Montée en charge du lancement', 'MIN(1,{N}/<ramp_months>)', PCT, 'avg', '%')
A.row('adopt', 'Part d’inscription retenue (scénario)', '<<adoption>>*<scen_adopt>', PCT, 'avg', '%')
A.row('new_reg', 'Nouveaux élèves inscrits', '[mkt]/12*[season]*[ramp]*[adopt]', NUM, 'sum', 'élèves', bold=True)
A.row('cum_reg', 'Élèves inscrits cumulés', '[cum_reg@p]+[new_reg]', NUM, 'end', 'élèves')
A.section('Abonnements (stock en fin de mois)')
A.row('new_th', 'Nouveaux abonnés Théorie', '[new_reg]*<mix_th>*<scen_conv>', NUM1, 'sum', 'abonnés')
A.row('subs_th', 'Abonnés Théorie actifs', '[subs_th@p]*(1-1/<dur_th>)+[new_th]', NUM1, 'end', 'abonnés')
A.row('new_co', 'Nouveaux abonnés Conduite', '[new_reg]*<mix_co>*<scen_conv>', NUM1, 'sum', 'abonnés')
A.row('subs_co', 'Abonnés Conduite actifs', '[subs_co@p]*(1-1/<dur_co>)+[new_co]', NUM1, 'end', 'abonnés')
A.row('new_in', 'Nouveaux abonnés Intégral', '[new_reg]*<mix_in>*<scen_conv>', NUM1, 'sum', 'abonnés')
A.row('subs_in', 'Abonnés Intégral actifs', '[subs_in@p]*(1-1/<dur_in>)+[new_in]', NUM1, 'end', 'abonnés')
A.row('subm_th', 'Abonnés-mois Théorie (facturés)', '[subs_th]', NUM1, 'sum', 'ab.-mois')
A.row('subm_co', 'Abonnés-mois Conduite (facturés)', '[subs_co]', NUM1, 'sum', 'ab.-mois')
A.row('subm_in', 'Abonnés-mois Intégral (facturés)', '[subs_in]', NUM1, 'sum', 'ab.-mois')
A.section('Leçons à la carte et utilisateurs')
A.row('new_alc', 'Nouveaux élèves à la carte', '[new_reg]*<mix_alc>*<scen_conv>', NUM1, 'sum', 'élèves')
A.row('act_alc', 'Élèves à la carte actifs', '[act_alc@p]*(1-1/<dur_alc>)+[new_alc]', NUM1, 'end', 'élèves')
A.row('new_free', 'Nouveaux utilisateurs gratuits', '[new_reg]-[new_th]-[new_co]-[new_in]-[new_alc]', NUM1, 'sum', 'util.')
A.row('act_free', 'Utilisateurs gratuits actifs', '[act_free@p]*(1-1/<dur_free>)+[new_free]', NUM1, 'end', 'util.')
A.row('mau', 'Utilisateurs actifs mensuels (MAU)', '[subs_th]+[subs_co]+[subs_in]+[act_alc]+[act_free]', NUM, 'end', 'util.', bold=True)
A.section('Heures de conduite et moniteurs')
A.row('rate', 'Tarif horaire moyen moniteur (TTC, indexé)', '<rate>*(1+<rate_idx>)^({Y}-1)', EUR2, 'avg', '€/h')
A.row('pidx', 'Indice de prix des packs', '(1+<p_idx>)^({Y}-1)', NUM2, 'avg', 'indice')
A.row('h_alc', 'Heures à la carte', '[act_alc]*<h_alc>', NUM, 'sum', 'h')
A.row('h_inc_co', 'Heures incluses consommées — Conduite', '[subs_co]*<min_co>/60*<util>', NUM, 'sum', 'h')
A.row('h_inc_in', 'Heures incluses consommées — Intégral', '[subs_in]*<min_in>/60*<util>', NUM, 'sum', 'h')
A.row('h_x_co', 'Heures supplémentaires — Conduite', '[subs_co]*<x_co>', NUM, 'sum', 'h')
A.row('h_x_in', 'Heures supplémentaires — Intégral', '[subs_in]*<x_in>', NUM, 'sum', 'h')
A.section('Heures obligatoires après échec')
A.row('ob_p', 'Candidats « 6 h obligatoires » captés', '<oblig_p_mkt>*(1+<<mkt_growth>>)^({Y}-1)/12*[season]*[ramp]*<<cap_op>>*<scen_adopt>', NUM1, 'sum', 'candidats')
A.row('h_ob', 'Heures obligatoires + supplémentaires', '[ob_p]*(<oblig_h>+<extra_h_oblig>)', NUM, 'sum', 'h')
A.row('ob_t', 'Candidats « 12 h de théorie » captés', '<oblig_t_mkt>*(1+<<mkt_growth>>)^({Y}-1)/12*[season]*[ramp]*<<cap_ot>>*<scen_adopt>', NUM1, 'sum', 'candidats')
A.row('h_tot', 'Total heures de conduite réservées', '[h_alc]+[h_inc_co]+[h_inc_in]+[h_x_co]+[h_x_in]+[h_ob]', NUM, 'sum', 'h', bold=True)
A.row('gmv', 'Volume d’affaires des leçons (valeur TTC au tarif plein)', '[h_tot]*[rate]', EUR, 'sum', '€')
A.row('instr', 'Moniteurs actifs nécessaires', 'ROUNDUP([h_tot]/<h_per_instr>,0)', NUM, 'end', 'moniteurs')
A.row('instr_new', 'Moniteurs à recruter / intégrer', 'MAX(0,[instr]-[instr@p]*(1-<instr_churn>))', NUM1, 'sum', 'moniteurs')

# ================================================================== REVENUS
R = F.MonthlySheet(wb, 'Revenus', 'Revenus et coûts directs (HTVA)',
                   'Commission sur leçons, packs, heures supplémentaires ; coûts directs = moniteurs (packs), paiement, infra variable, onboarding.', H, START)
R.section('Chiffre d’affaires HTVA')
R.row('rev_alc', 'Commissions sur leçons à la carte', '[Activité:h_alc]*[Activité:rate]*<comm>/(1+<tva>)',
      note='Commission = 20 % du prix TTC payé par l’élève ; traitée comme TTC (TVA due sur la commission).')
R.row('rev_th', 'Pack Théorie', '[Activité:subs_th]*<p_th>*[Activité:pidx]/(1+<tva>)')
R.row('rev_co', 'Pack Conduite',
      'IF(<grid>=1,[Activité:subs_co]*<p_co>*[Activité:pidx]/(1+<tva>),'
      '[Activité:subs_co]*<fee_co>*[Activité:pidx]/(1+<tva>)+[Activité:h_inc_co]*[Activité:rate]*(<comm>-<d_co>)/(1+<tva>))',
      note='Grille 1 : tout le prix du pack est un CA d’AutoSchub (TVA 21 % sur la totalité). Grille 2 : abonnement de service + marge sur les crédits d’heures.')
R.row('rev_in', 'Pack Intégral',
      'IF(<grid>=1,[Activité:subs_in]*<p_in>*[Activité:pidx]/(1+<tva>),'
      '[Activité:subs_in]*<fee_in>*[Activité:pidx]/(1+<tva>)+[Activité:h_inc_in]*[Activité:rate]*(<comm>-<d_in>)/(1+<tva>))')
R.row('rev_x', 'Marge sur heures supplémentaires (commission - réduction)',
      '([Activité:h_x_co]*(<comm>-<d_co>)+[Activité:h_x_in]*(<comm>-<d_in>))*[Activité:rate]/(1+<tva>)',
      note='Le moniteur est payé au prix plein (80 %) ; la réduction de l’élève est financée par la commission.')
R.row('rev_ob', 'Commissions sur heures obligatoires après échec (pratique + théorie)',
      '([Activité:h_ob]*[Activité:rate]+[Activité:ob_t]*<p_thcourse>*[Activité:pidx])*<comm_oblig>/(1+<tva>)')
R.row('rev_b2b', 'Abonnements écoles partenaires (option)', '<<b2b_n>>*<b2b_fee>')
R.row('rev_tot', 'Chiffre d’affaires total', '[rev_alc]+[rev_th]+[rev_co]+[rev_in]+[rev_x]+[rev_ob]+[rev_b2b]', total=True)
R.section('Coûts directs HTVA')
R.row('payout_ttc', 'Versements aux moniteurs pour heures incluses (montant versé)',
      'IF(<grid>=1,([Activité:h_inc_co]+[Activité:h_inc_in])*[Activité:rate]*(1-<comm>),0)',
      note='Le moniteur reçoit 80 % du prix plein (« toujours payé au prix plein de la leçon »). En grille 2, les crédits sont encaissés pour compte de tiers.')
R.row('c_payout', 'Coût HTVA des heures incluses', '[payout_ttc]*<cost_factor>')
R.row('c_payout_vat', 'dont TVA déductible sur versements (mémo)', '[payout_ttc]-[c_payout]')
R.row('pay_vol', 'Volume encaissé via la plateforme (TTC, mémo)',
      '([Activité:h_alc]+[Activité:h_ob])*[Activité:rate]+[Activité:ob_t]*<p_thcourse>*[Activité:pidx]+([Activité:h_x_co]*(1-<d_co>)+[Activité:h_x_in]*(1-<d_in>))*[Activité:rate]'
      '+[Activité:subs_th]*<p_th>*[Activité:pidx]'
      '+IF(<grid>=1,[Activité:subs_co]*<p_co>*[Activité:pidx]+[Activité:subs_in]*<p_in>*[Activité:pidx],'
      '[Activité:subs_co]*(<fee_co>*[Activité:pidx]+<min_co>/60*[Activité:rate]*(1-<d_co>))+[Activité:subs_in]*(<fee_in>*[Activité:pidx]+<min_in>/60*[Activité:rate]*(1-<d_in>)))')
R.row('pay_tx', 'Nombre de transactions (mémo)',
      '([Activité:h_alc]+[Activité:h_ob]+[Activité:h_x_co]+[Activité:h_x_in])/<lesson_len>+[Activité:ob_t]+[Activité:subs_th]+[Activité:subs_co]+[Activité:subs_in]', NUM, unit='tx')
R.row('c_fees', 'Frais de paiement (Mollie / Bancontact / SEPA)', '[pay_vol]*<fee_pct>+[pay_tx]*<fee_fix>')
R.row('c_host', 'Infrastructure variable', '[Activité:mau]*<host_per_user>')
R.row('c_onb', 'Acquisition & vérification des moniteurs', '[Activité:instr_new]*<onb_cost>')
R.row('c_tot', 'Total coûts directs', '[c_payout]+[c_fees]+[c_host]+[c_onb]', total=True)
R.row('gm', 'Marge brute', '[rev_tot]-[c_tot]', total=True)
R.row('gm_pct', 'Taux de marge brute', 'IF([rev_tot]=0,0,[gm]/[rev_tot])', PCT, 'custom', '%',
      ann='IF({c}%d=0,0,{c}%d/{c}%d)')
# fix custom annual formula for gm_pct (needs row numbers)
R.rows['gm_pct'].ann = 'IF({c}%d=0,0,{c}%d/{c}%d)' % (R.rows['rev_tot'].r, R.rows['gm'].r, R.rows['rev_tot'].r)

# ================================================================== PERSONNEL
P = F.MonthlySheet(wb, 'Personnel', 'Personnel — dirigeants et salariés (coût employeur)',
                   'Coût employeur = brut × (1 + ONSS) × 13,92 / 12 + avantages − réductions groupe-cible.', H, START)
P.section('Dirigeants')
P.row('fdr', 'Rémunération des fondateurs (coût société)', '<nb_fdr>*<<fdr_cost>>')
P.section('Salariés — coût employeur avant réductions')
HY = F.q('Hypothèses') + '!'
for k in range(len(ROLES)):
    rr = role_r0 + k
    t = ('IF({N}>=%s$B$%d,%s$C$%d*(1+<sal_idx>)^({Y}-1)*%s$D$%d*(1+<onss>)*<mult13>/12+<benefits>*%s$D$%d,0)'
         % (HY, rr, HY, rr, HY, rr, HY, rr))
    P.row('role%d' % k, ROLES[k][0], t)
P.row('sal_gross', 'Total salariés avant réductions', '+'.join('[role%d]' % k for k in range(len(ROLES))), total=True)
P.section('Réductions de cotisations (groupe-cible premiers engagements)')
red_terms = []
for k in range(len(ROLES)):
    rr = role_r0 + k
    if k == 0:
        red_terms.append('IF({N}>=%s$B$%d,<red1>/3,0)' % (HY, rr))
    elif k < 5:
        red_terms.append('IF(AND({N}>=%s$B$%d,{N}<%s$B$%d+36),<red25>/3,0)' % (HY, rr, HY, rr))
P.row('red', 'Réductions ONSS premiers engagements', '-(' + '+'.join(red_terms) + ')')
P.row('pers_tot', 'Total rémunérations et charges sociales', '[fdr]+[sal_gross]+[red]', total=True)
etp = '+'.join('IF({N}>=%s$B$%d,%s$D$%d,0)' % (HY, role_r0 + k, HY, role_r0 + k) for k in range(len(ROLES)))
P.row('etp', 'Effectif salarié (ETP)', etp, NUM1, 'end', 'ETP')
P.row('hc', 'Effectif total (fondateurs + salariés)', '[etp]+<nb_fdr>', NUM1, 'end', 'pers.')
P.row('hires', 'Arrivées du mois (pour matériel IT)',
      '+'.join('IF({N}=%s$B$%d,1,0)' % (HY, role_r0 + k) for k in range(len(ROLES))) + '+IF({N}=1,<nb_fdr>,0)', NUM, 'sum', 'pers.')

# ================================================================== CHARGES
C = F.MonthlySheet(wb, 'Charges', 'Services et biens divers (HTVA)', 'Charges d’exploitation hors personnel et hors coûts directs.', H, START)
C.section('Marketing')
C.row('mkt_var', 'Acquisition élèves (CAC × inscrits + candidats en échec)', '([Activité:new_reg]*<<cac>>+([Activité:ob_p]+[Activité:ob_t])*<cac_oblig>)*<scen_cac>')
C.row('mkt_fix', 'Marketing fixe', '<<mkt_fix>>')
C.section('Fonctionnement')
C.row('host', 'Hébergement & infrastructure fixe', '<<host_fix>>')
C.row('saas', 'Logiciels SaaS', '<<saas>>')
C.row('compta', 'Expert-comptable & secrétariat social', '<<compta>>')
C.row('legal', 'Juridique (lancement + récurrent)', 'IF({N}=1,<legal_init>,0)+<<legal_m>>')
C.row('constit', 'Frais de constitution', 'IF({N}=1,<constit>,0)')
C.row('insur', 'Assurances', '<<insur>>')
C.row('office', 'Bureaux', '<<office>>')
C.row('travel', 'Déplacements & événements', '<<travel>>')
C.row('telecom', 'Télécom & matériel courant', '<<telecom>>')
C.row('bank', 'Frais bancaires', '<<bank>>')
C.row('unexp', 'Imprévus', '<unexp>*([mkt_var]+[mkt_fix]+[host]+[saas]+[compta]+[legal]+[constit]+[insur]+[office]+[travel]+[telecom]+[bank])')
C.row('opex_tot', 'Total services et biens divers',
      '[mkt_var]+[mkt_fix]+[host]+[saas]+[compta]+[legal]+[constit]+[insur]+[office]+[travel]+[telecom]+[bank]+[unexp]', total=True)
C.row('opex_vat_base', 'dont base soumise à TVA belge déductible (mémo)',
      '[mkt_var]*0.5+[mkt_fix]+[compta]+[legal]+[constit]*0.6+[office]+[travel]*0.5+[telecom]+[unexp]',
      note='Hébergement/SaaS/publicité Meta-Google : autoliquidation (neutre). Assurances et frais bancaires : exonérés.')

# ================================================================== INVESTISSEMENTS
I = F.MonthlySheet(wb, 'Investissements', 'Investissements et amortissements', 'Amortissement linéaire sur 36 mois à partir du mois d’acquisition.', H, START)
I.section('Acquisitions HTVA')
I.row('cx_dev', 'Développement plateforme v1 (immobilisation incorporelle)',
      'IF(AND({N}>=<dev_start>,{N}<<dev_start>+<dev_months>),<dev_budget>/<dev_months>,0)')
I.row('cx_it', 'Matériel informatique', '[Personnel:hires]*<it_cost>')
I.row('cx_brand', 'Marque & nom de domaine', 'IF({N}=1,<brand>,0)')
I.row('capex_tot', 'Total investissements', '[cx_dev]+[cx_it]+[cx_brand]', total=True)
I.section('Amortissements')
I.row('amort_tot', 'Dotations aux amortissements (36 mois)', lambda j, col: F.amort_formula(j, I.rows['capex_tot'].r, 36))
I.row('nbv', 'Valeur nette comptable des immobilisations', '[nbv@p]+[capex_tot]-[amort_tot]', agg='end', total=True)

# ================================================================== FINANCEMENT
Fi = F.MonthlySheet(wb, 'Financement', 'Financement — fonds propres, prêts, subsides', 'Remboursement linéaire du capital après la franchise.', H, START)
Fi.section('Fonds propres et subsides')
Fi.row('cap_in', 'Apports en capital / levée de fonds', 'IF({N}=1,<cap>,0)+IF({N}=<seed_m>,<seed>,0)+IF({N}=<seed2_m>,<seed2>,0)')
Fi.row('subs', 'Subsides d’exploitation', 'IF({N}=<sub_m>,<sub>,0)')
for n, lab in ((1, 'Prêt 1 — subordonné régional'), (2, 'Prêt 2 — bancaire garanti')):
    Fi.section(lab)
    Fi.row('l%d_draw' % n, 'Versement', 'IF({N}=<l%d_m>,<l%d_amt>,0)' % (n, n))
    Fi.row('l%d_princ' % n, 'Remboursement du capital',
           'IF(AND({N}>(<l%d_m>+<l%d_grace>),[l%d_bal@p]>0.01),MIN([l%d_bal@p],<l%d_amt>/(<l%d_dur>-<l%d_grace>)),0)' % (n, n, n, n, n, n, n))
    Fi.row('l%d_int' % n, 'Intérêts', '[l%d_bal@p]*<l%d_rate>/12' % (n, n))
    Fi.row('l%d_bal' % n, 'Capital restant dû (fin de mois)', '[l%d_bal@p]+[l%d_draw]-[l%d_princ]' % (n, n, n), agg='end')
Fi.section('Totaux')
Fi.row('draw_tot', 'Total versements d’emprunts', '[l1_draw]+[l2_draw]', total=True)
Fi.row('princ_tot', 'Total remboursements de capital', '[l1_princ]+[l2_princ]', total=True)
Fi.row('int_tot', 'Total intérêts', '[l1_int]+[l2_int]', total=True)
Fi.row('bal_tot', 'Total dettes financières', '[l1_bal]+[l2_bal]', agg='end', total=True)

# ================================================================== RÉSULTATS (mensuel)
Re = F.MonthlySheet(wb, 'Résultats', 'Compte de résultats mensuel', 'ISOC calculé annuellement avec report des pertes fiscales, comptabilisé en décembre.', H, START)
Re.row('ca', 'Chiffre d’affaires', '[Revenus:rev_tot]', link=True)
Re.row('sub', 'Subsides d’exploitation', '[Financement:subs]', link=True)
Re.row('cd', 'Coûts directs', '-[Revenus:c_tot]')
Re.row('sbd', 'Services et biens divers', '-[Charges:opex_tot]')
Re.row('rem', 'Rémunérations et charges sociales', '-[Personnel:pers_tot]')
Re.row('ebitda', 'EBITDA', '[ca]+[sub]+[cd]+[sbd]+[rem]', total=True)
Re.row('amort', 'Amortissements', '-[Investissements:amort_tot]')
Re.row('ebit', 'Résultat d’exploitation (EBIT)', '[ebitda]+[amort]', total=True)
Re.row('fin', 'Charges financières', '-[Financement:int_tot]')
Re.row('ebt', 'Résultat avant impôt', '[ebit]+[fin]', total=True)
Re.section('Impôt des sociétés (calcul annuel)')
Re.row('loss_start', 'Pertes fiscales reportées — début d’année', None, agg='custom',
       ann=lambda i, col: '0' if i == 0 else '[loss_end@p]')
Re.row('base', 'Base imposable après déduction des pertes', None, agg='custom', ann='MAX(0,[ebt]-[loss_start])')
Re.row('loss_end', 'Pertes fiscales reportées — fin d’année', None, agg='custom', ann='MAX(0,[loss_start]-[ebt])')
Re.row('isoc_calc', 'ISOC de l’année', None, agg='custom',
       ann='IF(<isoc_red_ok>=1,<isoc_low>*MIN([base],<isoc_thr>)+<isoc_std>*MAX(0,[base]-<isoc_thr>),<isoc_std>*[base])')
isoc_rng = '$C$%d:$G$%d' % (Re.rows['isoc_calc'].r, Re.rows['isoc_calc'].r)
Re.row('isoc', 'Impôt des sociétés (comptabilisé en décembre)', 'IF({M}=12,-INDEX(%s,{Y}),0)' % isoc_rng)
Re.row('net', 'Résultat net', '[ebt]+[isoc]', total=True)
Re.row('ebitda_xs', 'EBITDA hors subsides', '[ebitda]-[sub]')
def _flag(j, col):
    cols = [L(FIRST + k) for k in range(max(0, j - 2), j + 1)]
    if len(cols) < 3:
        return '0'
    r = Re.rows['ebitda_xs'].r
    return 'IF(AND(%s),1,0)' % ','.join('%s%d>0' % (c, r) for c in cols)
Re.row('ebitda_flag', 'EBITDA hors subsides positif 3 mois consécutifs (1/0)', _flag, NUM, 'sum', 'mois')

# ================================================================== TRÉSORERIE
T = F.MonthlySheet(wb, 'Trésorerie', 'Budget de trésorerie mensuel (TTC)', 'TVA réglée trimestriellement le mois suivant le trimestre ; ISOC payé l’année suivante.', H, START)
T.section('Encaissements')
T.row('e_ca', 'Encaissements clients (CA TTC)', '[Revenus:rev_tot]*(1+<tva>)')
T.row('e_sub', 'Subsides', '[Financement:subs]')
T.row('e_cap', 'Apports en capital', '[Financement:cap_in]')
T.row('e_loan', 'Emprunts', '[Financement:draw_tot]')
T.row('e_tot', 'Total encaissements', '[e_ca]+[e_sub]+[e_cap]+[e_loan]', total=True)
T.section('Décaissements')
T.row('d_direct', 'Coûts directs (TTC)', '[Revenus:payout_ttc]+[Revenus:c_fees]+[Revenus:c_host]+[Revenus:c_onb]*(1+<tva>)')
T.row('d_opex', 'Services et biens divers (TTC)', '[Charges:opex_tot]+[Charges:opex_vat_base]*<tva>')
T.row('d_pers', 'Rémunérations et charges sociales', '[Personnel:pers_tot]')
T.row('d_capex', 'Investissements (TTC)', '[Investissements:capex_tot]*(1+<tva>)')
T.row('d_int', 'Intérêts', '[Financement:int_tot]')
T.row('d_princ', 'Remboursements d’emprunts', '[Financement:princ_tot]')
T.row('vat_coll', 'TVA collectée (mémo)', '[Revenus:rev_tot]*<tva>')
T.row('vat_ded', 'TVA déductible (mémo)',
      '[Revenus:c_payout_vat]+[Revenus:c_onb]*<tva>+[Charges:opex_vat_base]*<tva>+[Investissements:capex_tot]*<tva>')
T.row('vat_net', 'TVA nette du mois (mémo)', '[vat_coll]-[vat_ded]')
vr = lambda col: '%s%d' % (col, T.rows['vat_net'].r)
T.row('d_vat', 'Paiement (+) / remboursement (−) de TVA', lambda j, col: F.vat_settlement(j, vr))
isoc_rng2 = "'Résultats'!$C$%d:$G$%d" % (Re.rows['isoc_calc'].r, Re.rows['isoc_calc'].r)
T.row('d_isoc', 'Paiement de l’ISOC', 'IF(AND({M}=<isoc_pay_m>,{Y}>1),INDEX(%s,{Y}-1),0)' % isoc_rng2)
T.row('d_tot', 'Total décaissements', '[d_direct]+[d_opex]+[d_pers]+[d_capex]+[d_int]+[d_princ]+[d_vat]+[d_isoc]', total=True)
T.section('Solde')
T.row('flow', 'Flux net de trésorerie', '[e_tot]-[d_tot]', total=True)
T.row('cash_start', 'Trésorerie début de mois', '[cash_end@p]', agg=None)
T.row('cash_end', 'Trésorerie fin de mois', '[cash_start]+[flow]', agg='end', total=True)
T.row('cum_nofin', 'Trésorerie cumulée sans financement externe (besoin)',
      '[cum_nofin@p]+[flow]-[e_cap]-[e_loan]+[d_int]+[d_princ]', agg='end',
      note='Sert à mesurer le besoin de financement : son minimum = montant à lever avant marge de sécurité.')

# ================================================================== COMPTE DE RÉSULTATS (annuel, schéma belge)
CR = F.AnnualSheet(wb, 'Compte de résultats', 'Compte de résultats prévisionnel (schéma PCMN abrégé)',
                   'Art. 5:4 CSA : comptes de résultats projetés à 12 et 24 mois (présentés ici sur 5 ans).', H, START)
CR.section('Produits')
CR.row('ca', '70 — Chiffre d’affaires', '[Résultats:ca]', link=True)
CR.row('sub', '74 — Autres produits d’exploitation (subsides)', '[Résultats:sub]', link=True)
CR.row('prod', 'Total des produits d’exploitation', '[ca]+[sub]', total=True)
CR.section('Charges')
CR.row('cd', '60/61 — Coûts directs (moniteurs, paiement, infra variable)', '-[Résultats:cd]')
CR.row('sbd', '61 — Services et biens divers', '-[Résultats:sbd]')
CR.row('rem', '62 — Rémunérations, charges sociales (dont dirigeants)', '-[Résultats:rem]')
CR.row('ebitda', 'EBITDA', '[prod]-[cd]-[sbd]-[rem]', total=True)
CR.row('ebitda_pct', 'Marge d’EBITDA', 'IF([ca]=0,0,[ebitda]/[ca])', PCT)
CR.row('amort', '630 — Amortissements', '-[Résultats:amort]')
CR.row('ebit', '9901 — Résultat d’exploitation', '[ebitda]-[amort]', total=True)
CR.row('fin', '65 — Charges financières', '-[Résultats:fin]')
CR.row('ebt', '9903 — Résultat avant impôts', '[ebit]-[fin]', total=True)
CR.row('isoc', '67 — Impôt des sociétés', '-[Résultats:isoc]')
CR.row('net', '9904 — Résultat net de l’exercice', '[ebt]-[isoc]', total=True)
CR.row('cum', 'Résultat cumulé', lambda col: '[net]' if col == 'C' else '[cum@p]+[net]')

# ================================================================== BILAN
TV = "'Trésorerie'!"
vat_row = T.rows['vat_net'].r
q4 = ('SUMIFS(%s$%s$%d:$%s$%d,%s$%s$5:$%s$5,{c}$5,%s$%s$6:$%s$6,">=10")'
      % (TV, L(FIRST), vat_row, LASTM, vat_row, TV, L(FIRST), LASTM, TV, L(FIRST), LASTM))
B = F.AnnualSheet(wb, 'Bilan', 'Bilans prévisionnels (fin d’exercice)', 'Art. 5:4 CSA : bilan d’ouverture et bilans projetés à 12 et 24 mois.',
                  H, START, opening=True)
cap_r = Fi.rows['cap_in'].r
net_r = Re.rows['net'].r
B.section('ACTIF')
B.row('immo', 'Immobilisations (valeur nette)', '[Investissements:nbv]', open_tmpl='0', link=True)
B.row('vat_rec', 'Créance de TVA (remboursement attendu)', 'MAX(0,-%s)' % q4, open_tmpl='0')
B.row('cash', 'Trésorerie', '[Trésorerie:cash_end]', open_tmpl='<cap>', link=True)
B.row('assets', 'TOTAL ACTIF', '[immo]+[vat_rec]+[cash]', open_tmpl='[immo]+[vat_rec]+[cash]', total=True)
B.section('PASSIF')
B.row('capital', 'Capital et apports', "SUM('Financement'!$C$%d:{c}%d)" % (cap_r, cap_r), open_tmpl='<cap>')
B.row('retained', 'Résultat reporté', "SUM('Résultats'!$C$%d:{c}%d)" % (net_r, net_r), open_tmpl='0')
B.row('equity', 'Fonds propres', '[capital]+[retained]', open_tmpl='[capital]+[retained]', total=True)
B.row('debt', 'Dettes financières', '[Financement:bal_tot]', open_tmpl='0', link=True)
B.row('vat_pay', 'Dette de TVA (4e trimestre)', 'MAX(0,%s)' % q4, open_tmpl='0')
B.row('isoc_pay', 'Dette d’impôt des sociétés', "-'Résultats'!{c}%d" % Re.rows['isoc'].r, open_tmpl='0')
B.row('liab', 'TOTAL PASSIF', '[equity]+[debt]+[vat_pay]+[isoc_pay]', open_tmpl='[equity]+[debt]+[vat_pay]+[isoc_pay]', total=True)
B.row('check', 'Contrôle (actif − passif, doit être 0)', 'ROUND([assets]-[liab],2)', open_tmpl='ROUND([assets]-[liab],2)')
B.section('Ratios')
B.row('solv', 'Solvabilité (fonds propres / total)', 'IF([assets]=0,0,[equity]/[assets])', PCT)
B.row('net_debt', 'Dette nette (dettes financières − trésorerie)', '[debt]-[cash]')

F.finalize_all()

# ================================================================== UNIT ECONOMICS (feuille statique)
U = wb.create_sheet('Unit economics')
U['A1'] = 'Unit economics — rentabilité unitaire par produit (an 1, HTVA)'
U['A1'].font = F.F_TITLE
U['A2'] = 'Par abonné-mois pour les packs et par heure pour les leçons. Grille 1 = prix actuels de l’app ; grille 2 = structure recommandée.'
U['A2'].font = F.F_SUB
U.column_dimensions['A'].width = 62
for col in 'BCD':
    U.column_dimensions[col].width = 18
U.column_dimensions['E'].width = 70
h = lambda k: H.ref(k)
rows = [
    ('PACK CONDUITE (3 h incluses)', None, None, None),
    ('Prix payé par l’élève (TTC)', '=%s' % h('p_co'), '=%s' % h('disp_co'), ''),
    ('Coût réel par heure incluse pour l’élève (TTC)', '=B4/(%s/60)' % h('min_co'), '=C4/(%s/60)' % h('min_co'), 'Comparer au tarif à la carte (75 €/h).'),
    ('Chiffre d’affaires AutoSchub (HTVA)', '=%s/(1+%s)' % (h('p_co'), h('tva')),
     '=%s/(1+%s)+%s/60*%s*%s*(%s-%s)/(1+%s)' % (h('fee_co'), h('tva'), h('min_co'), h('util'), h('rate'), h('comm'), h('d_co'), h('tva')), ''),
    ('Coût HTVA des heures versées aux moniteurs', '=%s/60*%s*%s*(1-%s)*%s' % (h('min_co'), h('util'), h('rate'), h('comm'), h('cost_factor')), 0,
     'Grille 2 : encaissé et reversé pour compte des moniteurs (hors CA).'),
    ('Frais de paiement', '=B4*%s+%s' % (h('fee_pct'), h('fee_fix')), '=C4*%s+%s' % (h('fee_pct'), h('fee_fix')), ''),
    ('Contribution par abonné-mois', '=B6-B7-B8', '=C6-C7-C8', ''),
    ('Taux de contribution', '=IF(B6=0,0,B9/B6)', '=IF(C6=0,0,C9/C6)', ''),
    ('Contribution si 100 % des heures sont utilisées', '=B6-B7/%s-B8' % h('util'),
     '=%s/(1+%s)+%s/60*%s*(%s-%s)/(1+%s)-C8' % (h('fee_co'), h('tva'), h('min_co'), h('rate'), h('comm'), h('d_co'), h('tva')),
     'Test de résistance : élève qui consomme toutes ses heures.'),
    ('PACK INTÉGRAL (6 h incluses)', None, None, None),
    ('Prix payé par l’élève (TTC)', '=%s' % h('p_in'), '=%s' % h('disp_in'), ''),
    ('Coût réel par heure incluse pour l’élève (TTC)', '=B13/(%s/60)' % h('min_in'), '=C13/(%s/60)' % h('min_in'), ''),
    ('Chiffre d’affaires AutoSchub (HTVA)', '=%s/(1+%s)' % (h('p_in'), h('tva')),
     '=%s/(1+%s)+%s/60*%s*%s*(%s-%s)/(1+%s)' % (h('fee_in'), h('tva'), h('min_in'), h('util'), h('rate'), h('comm'), h('d_in'), h('tva')), ''),
    ('Coût HTVA des heures versées aux moniteurs', '=%s/60*%s*%s*(1-%s)*%s' % (h('min_in'), h('util'), h('rate'), h('comm'), h('cost_factor')), 0, ''),
    ('Frais de paiement', '=B13*%s+%s' % (h('fee_pct'), h('fee_fix')), '=C13*%s+%s' % (h('fee_pct'), h('fee_fix')), ''),
    ('Contribution par abonné-mois', '=B15-B16-B17', '=C15-C16-C17', ''),
    ('Taux de contribution', '=IF(B15=0,0,B18/B15)', '=IF(C15=0,0,C18/C15)', ''),
    ('Contribution si 100 % des heures sont utilisées', '=B15-B16/%s-B17' % h('util'),
     '=%s/(1+%s)+%s/60*%s*(%s-%s)/(1+%s)-C17' % (h('fee_in'), h('tva'), h('min_in'), h('rate'), h('comm'), h('d_in'), h('tva')), ''),
    ('PACK THÉORIE', None, None, None),
    ('Prix TTC', '=%s' % h('p_th'), '=%s' % h('p_th'), ''),
    ('CA HTVA', '=B22/(1+%s)' % h('tva'), '=C22/(1+%s)' % h('tva'), ''),
    ('Frais de paiement', '=B22*%s+%s' % (h('fee_pct'), h('fee_fix')), '=C22*%s+%s' % (h('fee_pct'), h('fee_fix')), ''),
    ('Contribution', '=B23-B24', '=C23-C24', ''),
    ('LEÇON À LA CARTE (par heure)', None, None, None),
    ('Prix payé par l’élève (TTC)', '=%s' % h('rate'), '=%s' % h('rate'), ''),
    ('Commission AutoSchub (HTVA)', '=B27*%s/(1+%s)' % (h('comm'), h('tva')), '=C27*%s/(1+%s)' % (h('comm'), h('tva')), ''),
    ('Frais de paiement (encaissement du prix complet)', '=B27*%s+%s/%s' % (h('fee_pct'), h('fee_fix'), h('lesson_len')),
     '=C27*%s+%s/%s' % (h('fee_pct'), h('fee_fix'), h('lesson_len')), ''),
    ('Contribution par heure', '=B28-B29', '=C28-C29', ''),
    ('Taux de contribution', '=IF(B28=0,0,B30/B28)', '=IF(C28=0,0,C30/C28)', ''),
]
hdr = ['Indicateur', 'Grille 1 (2027)', 'Grille 2 (recommandée)', '', 'Commentaire']
U['A2'] = None
U['E1'] = 'Par abonné-mois (packs) ou par heure (leçons). Grille 1 = prix actuels de l’app ; grille 2 = structure recommandée.'
U['E1'].font = F.F_SUB
for i, x in enumerate(hdr):
    c = U.cell(row=2, column=i + 1, value=x)
    c.font = F.F_HDR
    c.fill = F.FILL_HDR
r = 2
for lab, b, cc, com in rows:
    r += 1
    U.cell(row=r, column=1, value=lab)
    if b is None:
        U.cell(row=r, column=1).font = F.F_SEC
        for col in range(1, 6):
            U.cell(row=r, column=col).fill = F.FILL_SEC
        continue
    U.cell(row=r, column=1).font = F.F_TXT
    # les formules ont été écrites pour une première ligne de données en 4 : décalage +0 car l'en-tête est en 3
    for col, v in ((2, b), (3, cc)):
        cell = U.cell(row=r, column=col, value=v)
        cell.font = F.F_CALC if isinstance(v, str) else F.F_IN
        cell.number_format = PCT if 'Taux' in lab else EUR2
    U.cell(row=r, column=5, value=com).font = F.F_SUB
U.freeze_panes = 'B3'

# ================================================================== SYNTHÈSE
S = synth_ws
S['A1'] = 'AutoSchub — synthèse du plan financier de l’application'
S['A1'].font = F.F_TITLE
S['A2'] = '="Scénario "&CHOOSE(%s,"prudent","central","ambitieux")&" — grille tarifaire "&CHOOSE(%s,"2027 alignée auto-écoles","pack scindé recommandé")&" — démarrage "&TEXT(MONTH(%s),"00")&"/"&YEAR(%s)' % (
    H.ref('scenario'), H.ref('grid'), START, START)
S['A2'].font = F.F_SUB
S.column_dimensions['A'].width = 48
for col in F.ANN:
    S.column_dimensions[col].width = 14
S.column_dimensions['B'].width = 3
for i, col in enumerate(F.ANN):
    c = S[col + '4']
    c.value = "='Compte de résultats'!%s6" % col
    c.font = F.F_HDR
    c.fill = F.FILL_HDR
    c.alignment = Alignment(horizontal='center')
S['A4'] = 'Indicateurs clés'
S['A4'].font = F.F_HDR
S['A4'].fill = F.FILL_HDR
kpis = [
    ('Élèves inscrits (cumul)', "'Activité'!{c}%d" % A.rows['cum_reg'].r, NUM),
    ('Utilisateurs actifs mensuels (fin d’année)', "'Activité'!{c}%d" % A.rows['mau'].r, NUM),
    ('Abonnés payants (fin d’année)', "'Activité'!{c}%d+'Activité'!{c}%d+'Activité'!{c}%d" % (A.rows['subs_th'].r, A.rows['subs_co'].r, A.rows['subs_in'].r), NUM),
    ('Heures de conduite réservées', "'Activité'!{c}%d" % A.rows['h_tot'].r, NUM),
    ('Volume d’affaires des leçons (TTC)', "'Activité'!{c}%d" % A.rows['gmv'].r, EUR),
    ('Moniteurs actifs nécessaires (fin d’année)', "'Activité'!{c}%d" % A.rows['instr'].r, NUM),
    ('Chiffre d’affaires (HTVA)', "'Compte de résultats'!{c}%d" % CR.rows['ca'].r, EUR),
    ('Marge brute', "'Revenus'!{c}%d" % R.rows['gm'].r, EUR),
    ('Taux de marge brute', "'Revenus'!{c}%d" % R.rows['gm_pct'].r, PCT),
    ('EBITDA', "'Compte de résultats'!{c}%d" % CR.rows['ebitda'].r, EUR),
    ('Marge d’EBITDA', "'Compte de résultats'!{c}%d" % CR.rows['ebitda_pct'].r, PCT),
    ('Résultat net', "'Compte de résultats'!{c}%d" % CR.rows['net'].r, EUR),
    ('Trésorerie fin d’année', "'Trésorerie'!{c}%d" % T.rows['cash_end'].r, EUR),
    ('Fonds propres fin d’année', "'Bilan'!{c}%d" % B.rows['equity'].r, EUR),
    ('Effectif total (fin d’année)', "'Personnel'!{c}%d" % P.rows['hc'].r, NUM1),
    ('Contrôle du bilan (doit être 0)', "'Bilan'!{c}%d" % B.rows['check'].r, NUM2),
]
r = 5
for lab, f, fmt in kpis:
    S.cell(row=r, column=1, value=lab).font = F.F_TXT
    for col in F.ANN:
        c = S[col + str(r)]
        c.value = '=' + f.replace('{c}', col)
        c.number_format = fmt
        c.font = F.F_LINK
    r += 1
r += 1
S.cell(row=r, column=1, value='Points clés du financement').font = F.F_SEC
r += 1
cash_rng = "'Trésorerie'!$%s$%d:$%s$%d" % (L(FIRST), T.rows['cash_end'].r, LASTM, T.rows['cash_end'].r)
need_rng = "'Trésorerie'!$%s$%d:$%s$%d" % (L(FIRST), T.rows['cum_nofin'].r, LASTM, T.rows['cum_nofin'].r)
flag_rng = "'Résultats'!$%s$%d:$%s$%d" % (L(FIRST), Re.rows['ebitda_flag'].r, LASTM, Re.rows['ebitda_flag'].r)
date_rng = "'Trésorerie'!$%s$4:$%s$4" % (L(FIRST), LASTM)
items = [
    ('Besoin de financement maximal (trésorerie cumulée sans financement)', '=-MIN(0,MIN(%s))' % need_rng, EUR),
    ('Financement prévu (capital + levées + prêts + subsides)', '=%s+%s+%s+%s+%s+%s' % (H.ref('cap'), H.ref('seed'), H.ref('seed2'), H.ref('l1_amt'), H.ref('l2_amt'), H.ref('sub')), EUR),
    ('Trésorerie minimale sur 60 mois (avec financement)', '=MIN(%s)' % cash_rng, EUR),
    ('Mois de la trésorerie minimale', '=INDEX(%s,MATCH(MIN(%s),%s,0))' % (date_rng, cash_rng, cash_rng), 'mmm-yy'),
    ('Premier mois d’EBITDA positif durable (3 mois consécutifs, hors subsides)', '=IFERROR(INDEX(%s,MATCH(1,%s,0)),"au-delà de 60 mois")' % (date_rng, flag_rng), 'mmm-yy'),
    ('Mois d’EBITDA positif sur les 12 derniers mois du plan', "=SUM('Résultats'!$%s$%d:$%s$%d)" % (L(FIRST + 48), Re.rows['ebitda_flag'].r, LASTM, Re.rows['ebitda_flag'].r), NUM),
]
for lab, f, fmt in items:
    S.cell(row=r, column=1, value=lab).font = F.F_TXT
    c = S.cell(row=r, column=3, value=f)
    c.number_format = fmt
    c.font = F.F_CALCB
    r += 1
# graphiques
ch = BarChart()
ch.type = 'col'
ch.title = 'Chiffre d’affaires, EBITDA et résultat net (€)'
ch.y_axis.title = '€'
ch.height = 7.5
ch.width = 17
for rr, name in ((11, 'CA'), (14, 'EBITDA'), (16, 'Résultat net')):
    ref = Reference(S, min_col=3, max_col=7, min_row=rr, max_row=rr)
    from openpyxl.chart import Series
    s = Series(ref, title=name)
    ch.series.append(s)
ch.set_categories(Reference(S, min_col=3, max_col=7, min_row=4, max_row=4))
S.add_chart(ch, 'I4')
lc = LineChart()
lc.title = 'Trésorerie fin de mois (€)'
lc.height = 7.5
lc.width = 17
tws = wb['Trésorerie']
lc.add_data(Reference(tws, min_col=FIRST, max_col=FIRST + NM - 1, min_row=T.rows['cash_end'].r, max_row=T.rows['cash_end'].r), from_rows=True, titles_from_data=False)
lc.set_categories(Reference(tws, min_col=FIRST, max_col=FIRST + NM - 1, min_row=4, max_row=4))
lc.legend = None
S.add_chart(lc, 'I21')

import extras
extras.finish_app(wb, H, OUT)
for name in ['Compte de résultats', 'Bilan', 'Unit economics']:
    wb.move_sheet(name, offset=-(wb.sheetnames.index(name) - 2 - ['Compte de résultats', 'Bilan', 'Unit economics'].index(name)))
if 'Scénarios' in wb.sheetnames:
    wb.move_sheet('Scénarios', offset=-(wb.sheetnames.index('Scénarios') - wb.sheetnames.index('Unit economics') - 1))
wb.save(OUT)
print('saved', OUT)

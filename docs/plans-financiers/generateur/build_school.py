import sys, datetime
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
import fplib as F
from fplib import EUR, EUR2, PCT, NUM, NUM1, NUM2, L, FIRST, NM, LASTM
from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference, Series
from openpyxl.styles import Alignment

OUT = sys.argv[1] if len(sys.argv) > 1 else 'AutoEcole_plan_financier.xlsx'
SCEN = int(sys.argv[2]) if len(sys.argv) > 2 else 2
SITE2 = int(sys.argv[3]) if len(sys.argv) > 3 else 1

wb = Workbook()
wb.remove(wb.active)
F.REG.clear()
wb.create_sheet('Lisez-moi')
synth_ws = wb.create_sheet('Synthèse')

H = F.Hyp(wb, 'Hypothèses', 'École de conduite agréée — hypothèses du plan financier',
          'Cellules bleues = hypothèses modifiables ; fond jaune = hypothèses clés ; noir = calculs. Montants en euros. Recherche effectuée le 04/11/2026.')

H.section('1. Paramètres généraux')
H.add('start', 'Date de démarrage du plan (mois 1 = constitution & dossier d’agrément)', datetime.date(2027, 1, 1), 'date',
      'Mois 1-3 : constitution de la SRL, bail, aménagement, dossier d’agrément (formulaire + redevance), recrutement.', 'mmm-yy')
H.add('scenario', 'Scénario actif (1 = prudent, 2 = central, 3 = ambitieux)', SCEN, 'choix', '', '0', key_flag=True)
H.add('open1', 'Ouverture du site 1 — Wallonie (mois n°)', 4, 'mois',
      'Implantation conseillée : Namur, Charleroi ou Liège (forte demande, 14 centres d’examen wallons). Délai d’agrément estimé à 3 mois.', NUM, key_flag=True)
H.add('site2', 'Ouverture d’un site 2 à Bruxelles (1 = oui, 0 = non)', SITE2, 'choix',
      'La formation est régionalisée : un site bruxellois nécessite un agrément de Bruxelles Mobilité (redevance 345 €, AE001) et un directeur adjoint.', '0', key_flag=True)
H.add('open2', 'Ouverture du site 2 — Bruxelles (mois n°)', 25, 'mois', 'Après 2 ans d’exploitation rentable du site 1.', NUM)
H.add('tva', 'Taux de TVA appliqué aux cours et aux achats', 0.21, '%',
      'Pas d’exonération identifiée pour les écoles commerciales (art. 44 CTVA vise l’enseignement sans but lucratif ; propositions de loi pour 6 % non adoptées). À confirmer par ruling (SDA).', PCT)
H.add('vat_car', 'Part de TVA déductible sur les frais de véhicules', 0.5, '%',
      'Prudence : limitation à 50 % (art. 45 §2 CTVA) appliquée par défaut ; une déduction plus élevée peut se justifier pour des véhicules exclusivement affectés à l’enseignement.', PCT)

H.section('2. Marché (contexte)')
H.add('mkt', 'Candidats entrant en formation pratique / an (W+B)', 78268, 'élèves',
      'Réussites théoriques 2025 W (152 005 × 37 %) + 2024 B (53 721 × 41 %). Voir plan AutoSchub.', NUM)
H.add('w_pr_rate', 'Taux de réussite à l’examen pratique (Wallonie)', 0.54, '%', 'SPW / Parlement wallon (2025) ; Bruxelles 51 % (2024).', PCT)

H.section('3. Prix de vente (TTC, an 1)')
H.add('p_h1', 'Heure de conduite B — prix moyen réalisé, Wallonie', 75, '€/h',
      'Forfaits 20 h médians ≈ 1 400-1 650 € (70-82 €/h) ; heure sup. médiane ≈ 70 €, à la carte ≈ 81 € (toutpourmonpermis.be, monautoecole.be) ; écoles sociales 45 €/h. Positionnement au niveau de la médiane, sous le prix à la carte.', EUR2, key_flag=True)
H.add('p_h2', 'Heure de conduite B — prix moyen réalisé, Bruxelles', 80, '€/h', 'Infor Jeunes : 50-75 €/h ; prix bruxellois plus élevés (loyers, trafic).', EUR2, key_flag=True)
H.add('p_idx', 'Indexation annuelle des prix', 0.03, '%/an', 'Hausse 2022 ≈ +5 % (RTBF) ; carburant 2026 élevé.', PCT)
H.add('forem', 'Part des heures financées par le chèque permis du Forem (site wallon)', 0.10, '%',
      'AGW 18/12/2025 : chèque permis pratique (30 h B) pour chercheurs d’emploi et travailleurs titres-services, plafond 2 004 € TTC.', PCT)
H.calc('forem_h', 'Prix horaire plafonné du chèque Forem', '2004/30', '€/h', 'Calcul : 2 004 € / 30 h.', EUR2)
H.add('p_exam', 'Accompagnement à l’examen pratique (véhicule + moniteur, ~2 h)', 110, '€', 'Pratique courante du marché (90-140 €).', EUR)
H.add('p_theory', 'Formation théorique en salle (12 h, cours collectifs)', 150, '€/élève', 'Obligatoire après 2 échecs (12 h) ; vendue aussi en préparation.', EUR)
H.add('p_file', 'Frais d’inscription / dossier par élève', 60, '€', 'Usuel dans les forfaits (ouverture de dossier, suivi administratif, attestation).', EUR)
H.add('p_rdv', 'Rendez-vous pédagogique filière libre (3 h, Wallonie)', 75, '€', 'Formation de 3 h obligatoire en filière libre wallonne (école agréée ou e-learning).', EUR)

H.section('4. Capacité et activité')
H.add('h_fte', 'Heures-moniteur vendables / véhicule / mois à pleine charge', 135, 'h',
      '38 h/sem. × 4,33 = 165 h payées, moins congés légaux/fériés (~12 %) et temps non facturable : ≈ 135 h (6,5 h de leçons/jour ouvré).', NUM, key_flag=True)
H.add('fill', 'Taux de remplissage selon l’ancienneté du site (année 1 à 5)', [0.50, 0.70, 0.80, 0.85, 0.85], '%',
      'Hypothèse : notoriété locale + apport d’élèves via AutoSchub. Colonne = année d’exploitation du site (pas l’année civile).', PCT, key_flag=True)
H.add('fill_cap', 'Taux de remplissage maximal (plafond, haute saison)', 0.95, '%', '', PCT)
H.add('ramp', 'Montée en charge à l’ouverture d’un site', 6, 'mois', '', NUM)
H.lst('season', ['Saisonnalité — janvier', 'Saisonnalité — février', 'Saisonnalité — mars', 'Saisonnalité — avril',
                 'Saisonnalité — mai', 'Saisonnalité — juin', 'Saisonnalité — juillet', 'Saisonnalité — août',
                 'Saisonnalité — septembre', 'Saisonnalité — octobre', 'Saisonnalité — novembre', 'Saisonnalité — décembre'],
      [0.92, 0.95, 1.0, 1.0, 1.02, 1.05, 1.12, 1.08, 1.0, 0.98, 0.95, 0.93], 'coef.',
      'Demande plus forte en été ; la capacité limite l’effet (plafond). Somme = 12.', NUM2)
H.add('h_student', 'Heures de conduite moyennes par élève', 24, 'h', 'Minimum 20 h (filière école) ; 30 h en accès direct ; heures sup. après échec.', NUM)
H.add('acc_student', 'Accompagnements à l’examen par élève', 1.4, 'nb', 'Taux de réussite pratique ~54 % ; une partie des candidats passe avec un autre véhicule.', NUM2)
H.add('acc_dur', 'Durée d’un accompagnement à l’examen', 2, 'h', 'Mobilise véhicule + moniteur.', NUM1)
H.add('theory_share', 'Part des élèves qui achètent la formation théorique', 0.35, '%', 'Hypothèse (taux d’échec théorique 59-63 %).', PCT)
H.add('rdv', 'Rendez-vous pédagogiques filière libre / mois (site wallon)', [8, 12, 15, 18, 20], 'nb/mois', 'Hypothèse.', NUM)
H.add('app_share', 'Part des heures vendues via l’application AutoSchub', [0.15, 0.20, 0.25, 0.25, 0.25], '%',
      'Synergie avec le plan 1 : l’école est un partenaire agréé de l’app ; commission de 20 % sur ces heures.', PCT)
H.add('app_comm', 'Commission AutoSchub sur ces heures', 0.20, '%', 'COMMISSION_RATE de l’app.', PCT)

H.section('5. Scénarios (B = prudent, C = central, D = ambitieux ; F = valeur retenue)')
H.scen('scen_fill', 'Multiplicateur du taux de remplissage', [0.85, 1.0, 1.08], 'x', '')
H.scen('scen_price', 'Multiplicateur de prix', [0.95, 1.0, 1.03], 'x', '')

H.section('6. Flotte de véhicules (véhicules en service, par année civile)')
H.add('fleet1', 'Véhicules — site 1 (Wallonie)', [2, 4, 5, 6, 6], 'véh.', 'Petites citadines manuelles à double commande (+ 1 automatique à partir de l’an 3 recommandée).', NUM, key_flag=True)
H.add('fleet2', 'Véhicules — site 2 (Bruxelles)', [0, 0, 3, 4, 5], 'véh.', 'Actif seulement si le site 2 est ouvert.', NUM, key_flag=True)
H.add('car_rent', 'Location longue durée par véhicule (entretien, pneus, taxe incluse)', 590, '€ HTVA/mois',
      'Estimation renting citadine (Peugeot 208 / Clio) 48 mois ; loueurs : à demander en devis.', EUR, key_flag=True)
H.add('dc_cost', 'Installation double commande (par véhicule mis en service)', 1400, '€ HTVA', 'Pédalier + rétroviseurs ; activé et amorti sur 48 mois.', EUR)
H.add('car_ins', 'Assurance auto-école par véhicule (RC, omnium, conducteur)', 3200, '€/an',
      'Assurance spécifique obligatoire (AR 11/05/2004) ; courtiers spécialisés (ex. Solidas). Exonérée de TVA.', EUR)
H.add('fuel_lh', 'Consommation de carburant par heure de conduite', 1.2, 'l/h', '≈ 20 km/h en moyenne × 6 l/100 km (conduite urbaine).', NUM2)
H.add('fuel_p', 'Prix du carburant (TTC)', 1.95, '€/l', 'SPF Économie : essence E10 ≈ 1,87-1,99 €/l en 2026 ; diesel jusqu’à 2,51 €/l (oct. 2026).', EUR2)
H.add('wear', 'Usure, nettoyage, petits frais par heure', 0.6, '€ HTVA/h', 'Hypothèse.', EUR2)

H.section('7. Personnel')
H.add('dir_cost', 'Rémunération du fondateur-directeur (brevet I) — coût société', [3000, 3800, 4300, 4600, 4900], '€/mois',
      'Le directeur doit être titulaire du brevet I (brevets II et III depuis 3 ans, permis B depuis 3 ans). Cotisations d’indépendant à sa charge.', EUR, key_flag=True)
H.add('dir_teach', 'Part du temps du directeur consacrée à l’enseignement', 0.6, 'ETP', 'Le directeur couvre 60 % d’un poste de moniteur sur le site 1.', NUM1)
H.add('instr_gross', 'Salaire brut moniteur (brevet II / III)', 2500, '€/mois',
      'CP 140.03 : 2 100-2 400 € débutant, 2 800-3 200 € expérimenté (Trajektoire 2026). Pénurie de moniteurs : prévoir prime.', EUR, key_flag=True)
H.add('indep', 'Part des heures données par des moniteurs indépendants (payés à l’heure)', 0.5, '%',
      'Pratique courante : moniteurs indépendants agréés attachés à l’école, rémunérés à l’heure prestée → coût variable. Risque de requalification à encadrer (contrat, autonomie).', PCT, key_flag=True)
H.add('indep_rate', 'Rémunération horaire d’un moniteur indépendant', 32, '€/h',
      'Hypothèse (≈ 45 % du prix HTVA) ; supposé sous franchise TVA ou TVA déductible.', EUR2, key_flag=True)
H.add('sec_gross', 'Salaire brut secrétariat / accueil', 2400, '€/mois', 'Hypothèse.', EUR)
H.add('sec1_fte', 'Secrétariat — site 1', [0.5, 0.5, 1, 1, 1], 'ETP', '', NUM1)
H.add('sec2_fte', 'Secrétariat — site 2', 0.5, 'ETP', '', NUM1)
H.add('adj_gross', 'Salaire brut directeur adjoint site 2 (brevet I)', 3600, '€/mois', 'Le directeur ne peut exercer que dans une seule école ; chaque unité doit être encadrée.', EUR)
H.add('adj_teach', 'Part du temps du directeur adjoint consacrée à l’enseignement', 0.6, 'ETP', 'Le directeur adjoint est aussi moniteur breveté.', NUM1)
H.add('onss', 'Cotisations patronales ONSS', 0.25, '%', '≈ 25 % secteur marchand.', PCT)
H.add('mult13', 'Mois payés par an (13e mois + double pécule)', 13.92, 'mois', '', NUM2)
H.add('benefits', 'Avantages & frais par ETP (chèques-repas, AT, médecine du travail, secrétariat social)', 230, '€/mois', '', EUR)
H.add('sal_idx', 'Indexation annuelle des salaires', 0.02, '%/an', '', PCT)
H.add('training', 'Formation continue & agrément du personnel', 300, '€/ETP moniteur/an', 'Recyclage obligatoire, redevances d’agrément du personnel.', EUR)
H.add('red1', 'Réduction ONSS 1er travailleur', 2000, '€/trim.', 'Sans limite de durée (régime au 01/07/2026).', EUR)
H.add('red25', 'Réduction ONSS travailleurs 2 à 5', 1000, '€/trim.', '12 trimestres (approximation : 36 mois après l’ouverture du site 1).', EUR)

H.section('8. Locaux et frais de structure (HTVA)')
H.add('rent1', 'Loyer site 1 (local commercial 80-100 m², salle de cours)', 1300, '€/mois',
      'Locaux obligatoires : salle de cours, sanitaire, accueil, administration ; interdits dans un débit de boissons ou une habitation (AR 11/05/2004). Bail commercial, loyer sans TVA.', EUR)
H.add('rent2', 'Loyer site 2 (Bruxelles)', 2100, '€/mois', 'Idem, loyers bruxellois plus élevés.', EUR)
H.add('chg', 'Charges locatives & énergie par site', 280, '€/mois', '', EUR)
H.add('depo', 'Garantie locative (mois de loyer)', 3, 'mois', 'Usage bail commercial.', NUM)
H.add('fit1', 'Aménagement site 1 (salle de cours, mobilier, matériel didactique, IT, enseigne)', 18000, '€ HTVA',
      'Matériel didactique obligatoire (tableaux, schémas, maquettes). Amorti sur 60 mois.', EUR)
H.add('fit2', 'Aménagement site 2', 22000, '€ HTVA', '', EUR)
H.add('agr_init', 'Agrément de l’école / unité (redevance + dossier)', 600, '€', 'Bruxelles : 345 € par agrément ; Wallonie : formulaire + redevance ; extraits 596.1.', EUR)
H.add('agr_year', 'Redevance annuelle par unité d’établissement', 182, '€/an', 'Bruxelles 2026 : 182 €/an par unité.', EUR)
H.add('soft', 'Logiciel de gestion, planning, e-learning théorie (par site)', 150, '€/mois', '', EUR)
H.add('mkt_launch', 'Marketing de lancement par site', 6000, '€', 'Réparti sur 3 mois autour de l’ouverture.', EUR)
H.add('mkt_m', 'Marketing récurrent par site', [800, 900, 1000, 1100, 1200], '€/mois', 'Google Ads, réseaux sociaux, écoles secondaires, fiches Google.', EUR)
H.add('compta', 'Expert-comptable & secrétariat social', [500, 550, 650, 700, 750], '€/mois', '', EUR)
H.add('legal_init', 'Juridique de lancement (bail, contrats élèves, CGV, RGPD)', 2500, '€', 'Contrat écrit obligatoire avec l’élève et affichage des tarifs.', EUR)
H.add('constit', 'Frais de constitution de la SRL', 1500, '€', '', EUR)
H.add('ins_rc', 'Assurances RC exploitation, locaux, protection juridique (par site)', 120, '€/mois', 'Exonérées de TVA.', EUR)
H.add('tel', 'Télécom & fournitures (par site)', 220, '€/mois', '', EUR)
H.add('bank', 'Frais bancaires', 35, '€/mois', '', EUR)
H.add('pay_pct', 'Frais d’encaissement (terminal Bancontact, paiement en ligne)', 0.006, '% du CA TTC', '', PCT)
H.add('unexp', 'Provision pour imprévus (% des frais de structure)', 0.05, '%', '', PCT)

H.section('9. Financement')
H.add('cap', 'Apport en capital du fondateur', 40000, '€', 'Libéré à la constitution.', EUR, key_flag=True)
H.add('cap2', 'Augmentation de capital à l’ouverture du site 2 (associé / investisseur)', 150000, '€',
      'Entrée d’un associé ou de business angels (tax shelter start-up 30-45 % si société < 4 ans). Évite des fonds propres négatifs (sonnette d’alarme, art. 5:153 CSA).', EUR, key_flag=True)
H.add('cap2_m', 'Mois de l’augmentation de capital', 24, 'mois', '', NUM)
H.add('l1_amt', 'Prêt 1 — crédit bancaire avec garantie Wallonie Entreprendre', 100000, '€', 'Garantie jusqu’à 75 % ; finance aménagement, BFR et pertes de démarrage.', EUR)
H.add('l1_m', 'Prêt 1 — mois de versement', 2, 'mois', '', NUM)
H.add('l1_dur', 'Prêt 1 — durée', 60, 'mois', '', NUM)
H.add('l1_grace', 'Prêt 1 — franchise en capital', 6, 'mois', '', NUM)
H.add('l1_rate', 'Prêt 1 — taux annuel', 0.055, '%', '', PCT)
H.add('l2_amt', 'Prêt 2 — « Prêt Coup de pouce » (proches, crédit d’impôt wallon)', 50000, '€',
      'Prêt de particuliers à une PME wallonne avec crédit d’impôt annuel pour le prêteur (Wallonie Entreprendre).', EUR)
H.add('l2_m', 'Prêt 2 — mois de versement', 2, 'mois', '', NUM)
H.add('l2_dur', 'Prêt 2 — durée', 48, 'mois', '', NUM)
H.add('l2_grace', 'Prêt 2 — franchise en capital', 12, 'mois', '', NUM)
H.add('l2_rate', 'Prêt 2 — taux annuel', 0.025, '%', 'Hypothèse (taux plafonné du dispositif).', PCT)
H.add('l3_amt', 'Prêt 3 — financement du site bruxellois', 150000, '€', 'Banque + finance&invest.brussels (prêt proxi / co-financement).', EUR)
H.add('l3_m', 'Prêt 3 — mois de versement', 23, 'mois', '', NUM)
H.add('l3_dur', 'Prêt 3 — durée', 84, 'mois', '', NUM)
H.add('l3_grace', 'Prêt 3 — franchise en capital', 6, 'mois', '', NUM)
H.add('l3_rate', 'Prêt 3 — taux annuel', 0.055, '%', '', PCT)
H.add('sub1', 'Prime Airbag (Forem) — 1re tranche', 6250, '€',
      'Airbag : jusqu’à 12 500 € pour un demandeur d’emploi qui lance une activité indépendante à titre principal en Wallonie (éligibilité à vérifier pour un dirigeant de SRL). Cumulable avec les chèques-entreprises.', EUR)
H.add('sub1_m', 'Mois d’encaissement 1re tranche', 6, 'mois', '', NUM)
H.add('sub2', 'Prime Airbag — 2e tranche', 6250, '€', '', EUR)
H.add('sub2_m', 'Mois d’encaissement 2e tranche', 18, 'mois', '', NUM)

H.section('10. Fiscalité')
H.add('isoc_low', 'ISOC — taux réduit PME', 0.20, '%', '20 % sur les 100 000 premiers euros si conditions remplies.', PCT)
H.add('isoc_thr', 'ISOC — plafond tranche réduite', 100000, '€', '', EUR)
H.add('isoc_std', 'ISOC — taux normal', 0.25, '%', '', PCT)
H.add('isoc_red_ok', 'Taux réduit applicable (1 = oui)', 1, 'choix', 'Rémunération dirigeant ≥ 50 000 €/an ou ≥ bénéfice imposable.', '0')
H.add('isoc_pay_m', 'Mois de paiement de l’ISOC de l’année précédente', 9, 'mois', 'Sans versements anticipés (majoration possible).', NUM)

START = H.ref('start')
HY = F.q('Hypothèses') + '!'
fill_r = H.refs['fill'][1]

# ================================================================== ACTIVITÉ
A = F.MonthlySheet(wb, 'Activité', 'Activité par site — capacité, heures, élèves', 'Colonnes C-G = totaux ou fin d’année.', H, START)
A.row('season', 'Coefficient saisonnier', H.lref('season', '{M}'), NUM2, 'avg', 'coef.')
A.row('pidx', 'Indice de prix', '(1+<p_idx>)^({Y}-1)*<scen_price>', NUM2, 'avg', 'indice')
for s, lab in ((1, 'Site 1 — Wallonie'), (2, 'Site 2 — Bruxelles')):
    A.section(lab)
    on = 'IF({N}>=<open%d>,1,0)' % s if s == 1 else 'IF(AND(<site2>=1,{N}>=<open2>),1,0)'
    A.row('on%d' % s, 'Site ouvert (1/0)', on, NUM, 'end', '')
    A.row('sy%d' % s, 'Année d’exploitation du site', 'IF([on%d]=1,MIN(5,INT(({N}-<open%d>)/12)+1),0)' % (s, s), NUM, 'end', 'an')
    A.row('fleet%d' % s, 'Véhicules en service', '[on%d]*<<fleet%d>>' % (s, s), NUM, 'end', 'véh.')
    A.row('fill%d' % s, 'Taux de remplissage',
          'IF([on%d]=1,MIN(<fill_cap>,INDEX(%s$B$%d:$F$%d,[sy%d])*<scen_fill>*[season]*MIN(1,({N}-<open%d>+1)/<ramp>)),0)'
          % (s, HY, fill_r, fill_r, s, s), PCT, 'avg', '%')
    A.row('cap%d' % s, 'Heures-moniteur disponibles', '[fleet%d]*<h_fte>' % s, NUM, 'sum', 'h')
    A.row('sold%d' % s, 'Heures-moniteur vendues', '[cap%d]*[fill%d]' % (s, s), NUM, 'sum', 'h')
    A.row('les%d' % s, 'dont heures de leçons de conduite', '[sold%d]/(1+<acc_student>*<acc_dur>/<h_student>)' % s, NUM, 'sum', 'h', bold=True)
    A.row('stu%d' % s, 'Élèves formés (équivalent)', '[les%d]/<h_student>' % s, NUM1, 'sum', 'élèves')
    A.row('acc%d' % s, 'Accompagnements à l’examen', '[stu%d]*<acc_student>' % s, NUM1, 'sum', 'nb')
    if s == 1:
        A.row('price1', 'Prix horaire moyen effectif (TTC, avec chèques Forem)',
              '((1-<forem>)*<p_h1>*[pidx]+<forem>*<forem_h>)', EUR2, 'avg', '€/h')
    else:
        A.row('price2', 'Prix horaire moyen effectif (TTC)', '<p_h2>*[pidx]', EUR2, 'avg', '€/h')
A.section('Total')
A.row('fleet', 'Véhicules en service (total)', '[fleet1]+[fleet2]', NUM, 'end', 'véh.', bold=True)
A.row('les', 'Heures de leçons (total)', '[les1]+[les2]', NUM, 'sum', 'h', bold=True)
A.row('stu', 'Élèves formés (total)', '[stu1]+[stu2]', NUM, 'sum', 'élèves', bold=True)
A.row('veh_new', 'Véhicules mis en service', 'MAX(0,[fleet]-[fleet@p])', NUM, 'sum', 'véh.')
A.row('drive_h', 'Heures de roulage (leçons + examens)', '[les]+([acc1]+[acc2])*<acc_dur>', NUM, 'sum', 'h')

# ================================================================== REVENUS & COÛTS DIRECTS
R = F.MonthlySheet(wb, 'Revenus', 'Chiffre d’affaires et coûts directs (HTVA)', 'Les coûts liés aux véhicules incluent la TVA non déductible.', H, START)
R.section('Chiffre d’affaires HTVA')
R.row('r_les1', 'Leçons de conduite — site 1', '[Activité:les1]*[Activité:price1]/(1+<tva>)')
R.row('r_les2', 'Leçons de conduite — site 2', '[Activité:les2]*[Activité:price2]/(1+<tva>)')
R.row('r_acc', 'Accompagnements à l’examen', '([Activité:acc1]+[Activité:acc2])*<p_exam>*[Activité:pidx]/(1+<tva>)')
R.row('r_file', 'Frais d’inscription / dossier', '[Activité:stu]*<p_file>*[Activité:pidx]/(1+<tva>)')
R.row('r_th', 'Formations théoriques', '[Activité:stu]*<theory_share>*<p_theory>*[Activité:pidx]/(1+<tva>)')
R.row('r_rdv', 'Rendez-vous pédagogiques (filière libre)', '[Activité:on1]*<<rdv>>*<p_rdv>*[Activité:pidx]/(1+<tva>)')
R.row('rev_tot', 'Chiffre d’affaires total', '[r_les1]+[r_les2]+[r_acc]+[r_file]+[r_th]+[r_rdv]', total=True)
R.section('Coûts directs HTVA')
R.row('c_app', 'Commissions AutoSchub', '<<app_share>>*<app_comm>*([Activité:les1]*[Activité:price1]+[Activité:les2]*[Activité:price2])/(1+<tva>)',
      note='Facturées avec TVA par AutoSchub (déductible).')
R.row('car_ht', 'Achats liés aux véhicules HTVA (mémo : carburant, usure, location)',
      '[Activité:drive_h]*(<fuel_lh>*<fuel_p>/(1+<tva>)+<wear>)+[Activité:fleet]*<car_rent>')
R.row('c_car', 'Véhicules : carburant, usure, location (avec TVA non déductible)', '[car_ht]*(1+<tva>*(1-<vat_car>))')
R.row('c_ins', 'Assurances des véhicules', '[Activité:fleet]*<car_ins>/12')
R.row('c_pay', 'Frais d’encaissement', '[rev_tot]*(1+<tva>)*<pay_pct>')
R.row('c_tot', 'Total coûts directs', '[c_app]+[c_car]+[c_ins]+[c_pay]', total=True)
R.row('gm', 'Marge brute (avant personnel)', '[rev_tot]-[c_tot]', total=True)
R.row('gm_pct', 'Taux de marge brute', 'IF([rev_tot]=0,0,[gm]/[rev_tot])', PCT, 'custom', '%')
R.rows['gm_pct'].ann = 'IF({c}%d=0,0,{c}%d/{c}%d)' % (R.rows['rev_tot'].r, R.rows['gm'].r, R.rows['rev_tot'].r)

# ================================================================== PERSONNEL
P = F.MonthlySheet(wb, 'Personnel', 'Personnel — directeur, moniteurs, secrétariat', 'Coût employeur = brut × (1 + ONSS) × 13,92 / 12 + avantages − réductions.', H, START)
ecost = lambda g: '%s*(1+<sal_idx>)^({Y}-1)*(1+<onss>)*<mult13>/12+<benefits>' % g
P.row('dir', 'Fondateur-directeur (coût société)', '<<dir_cost>>')
P.row('fte_i1', 'Moniteurs salariés — site 1 (ETP)', 'MAX(0,[Activité:fleet1]-<dir_teach>*[Activité:on1])*(1-<indep>)', NUM1, 'end', 'ETP')
P.row('fte_i2', 'Moniteurs salariés — site 2 (ETP)', 'MAX(0,[Activité:fleet2]-<adj_teach>*[Activité:on2])*(1-<indep>)', NUM1, 'end', 'ETP')
P.row('h_ind', 'Heures données par des moniteurs indépendants',
      '<indep>*([Activité:sold1]*IF([Activité:fleet1]=0,0,MAX(0,[Activité:fleet1]-<dir_teach>)/[Activité:fleet1])+[Activité:sold2]*IF([Activité:fleet2]=0,0,MAX(0,[Activité:fleet2]-<adj_teach>)/[Activité:fleet2]))', NUM, 'sum', 'h')
P.row('fte_s1', 'Secrétariat — site 1 (ETP)', 'IF({N}>=<open1>-1,<<sec1_fte>>,0)', NUM1, 'end', 'ETP')
P.row('fte_s2', 'Secrétariat — site 2 (ETP)', 'IF(AND(<site2>=1,{N}>=<open2>-1),<sec2_fte>,0)', NUM1, 'end', 'ETP')
P.row('fte_a2', 'Directeur adjoint — site 2 (ETP)', 'IF(AND(<site2>=1,{N}>=<open2>-2),1,0)', NUM1, 'end', 'ETP')
P.row('c_i', 'Moniteurs salariés', '([fte_i1]+[fte_i2])*(%s)' % ecost('<instr_gross>'))
P.row('c_s', 'Secrétariat / accueil', '([fte_s1]+[fte_s2])*(%s)' % ecost('<sec_gross>'))
P.row('c_a', 'Directeur adjoint', '[fte_a2]*(%s)' % ecost('<adj_gross>'))
P.row('c_ind', 'Moniteurs indépendants (honoraires)', '[h_ind]*<indep_rate>*(1+<p_idx>)^({Y}-1)')
P.row('fte', 'Effectif salarié total (ETP)', '[fte_i1]+[fte_i2]+[fte_s1]+[fte_s2]+[fte_a2]', NUM1, 'end', 'ETP')
P.row('red', 'Réductions ONSS premiers engagements',
      '-(IF([fte]>0,<red1>/3,0)+IF({N}<<open1>+36,MIN(4,MAX(0,ROUNDUP([fte],0)-1))*<red25>/3,0))',
      note='Approximation : 1er travailleur sans limite ; travailleurs 2 à 5 pendant 36 mois après l’ouverture.')
P.row('train', 'Formation continue & agrément du personnel', '(([Activité:fleet1]+[Activité:fleet2]))*<training>/12')
P.row('pers_tot', 'Total rémunérations, charges sociales et honoraires moniteurs', '[dir]+[c_i]+[c_s]+[c_a]+[c_ind]+[red]+[train]', total=True)

# ================================================================== CHARGES DE STRUCTURE
C = F.MonthlySheet(wb, 'Charges', 'Frais de structure (HTVA)', 'Loyers dès 2 mois avant l’ouverture (travaux).', H, START)
for s in (1, 2):
    pre = 'IF({N}>=<open1>-2,1,0)' if s == 1 else 'IF(AND(<site2>=1,{N}>=<open2>-2),1,0)'
    C.row('pre%d' % s, 'Site %d sous bail (1/0)' % s, pre, NUM, 'end', '')
    C.row('rent%d' % s, 'Loyer et charges — site %d' % s, '[pre%d]*(<rent%d>+<chg>)' % (s, s))
    C.row('agr%d' % s, 'Agrément et redevances — site %d' % s,
          'IF({N}=<open%d>-2,<agr_init>*%s,0)+IF(AND({M}=1,[Activité:on%d]=1),<agr_year>,0)' % (s, '1' if s == 1 else '<site2>', s))
    C.row('mktl%d' % s, 'Marketing de lancement — site %d' % s,
          'IF(AND({N}>=<open%d>-1,{N}<=<open%d>+1),<mkt_launch>/3,0)*%s' % (s, s, '1' if s == 1 else '<site2>'))
    C.row('ops%d' % s, 'Logiciel, télécom, fournitures, assurances RC — site %d' % s, '[pre%d]*(<soft>+<tel>+<ins_rc>)' % s)
    C.row('mkt%d' % s, 'Marketing récurrent — site %d' % s, '[Activité:on%d]*<<mkt_m>>' % s)
C.row('compta', 'Expert-comptable & secrétariat social', '<<compta>>')
C.row('legal', 'Juridique de lancement', 'IF({N}=1,<legal_init>,0)')
C.row('constit', 'Frais de constitution', 'IF({N}=1,<constit>,0)')
C.row('bank', 'Frais bancaires', '<bank>')
base = '+'.join('[%s%d]' % (k, s) for s in (1, 2) for k in ('rent', 'agr', 'mktl', 'ops', 'mkt')) + '+[compta]+[legal]+[constit]+[bank]'
C.row('unexp', 'Imprévus', '<unexp>*(%s)' % base)
C.row('opex_tot', 'Total frais de structure', base + '+[unexp]', total=True)
C.row('opex_vat_base', 'dont base soumise à TVA déductible (mémo)',
      '[mktl1]+[mktl2]+[mkt1]+[mkt2]+([ops1]+[ops2])*0.6+[compta]+[legal]+[constit]*0.6+[unexp]',
      note='Loyers (bail sans option TVA), assurances, redevances, frais bancaires : sans TVA.')

# ================================================================== INVESTISSEMENTS
I = F.MonthlySheet(wb, 'Investissements', 'Investissements, amortissements et garanties', 'Aménagements amortis sur 60 mois, doubles commandes sur 48 mois.', H, START)
I.row('cx_fit', 'Aménagement des locaux', 'IF({N}=<open1>-1,<fit1>,0)+IF(AND(<site2>=1,{N}=<open2>-1),<fit2>,0)')
I.row('cx_dc', 'Doubles commandes', '[Activité:veh_new]*<dc_cost>')
I.row('capex_tot', 'Total investissements', '[cx_fit]+[cx_dc]', total=True)
I.row('am_fit', 'Amortissement aménagements (60 mois)', lambda j, col: F.amort_formula(j, I.rows['cx_fit'].r, 60))
I.row('am_dc', 'Amortissement doubles commandes (48 mois)', lambda j, col: F.amort_formula(j, I.rows['cx_dc'].r, 48))
I.row('amort_tot', 'Total amortissements', '[am_fit]+[am_dc]', total=True)
I.row('nbv', 'Valeur nette comptable', '[nbv@p]+[capex_tot]-[amort_tot]', agg='end', total=True)
I.row('depo_out', 'Garanties locatives versées', 'IF({N}=<open1>-2,<depo>*<rent1>,0)+IF(AND(<site2>=1,{N}=<open2>-2),<depo>*<rent2>,0)')
I.row('depo_bal', 'Garanties locatives (solde)', '[depo_bal@p]+[depo_out]', agg='end')

# ================================================================== FINANCEMENT
Fi = F.MonthlySheet(wb, 'Financement', 'Financement — capital, prêts, primes', 'Remboursement linéaire du capital après franchise.', H, START)
Fi.row('cap_in', 'Apports en capital', 'IF({N}=1,<cap>,0)+IF({N}=<cap2_m>,<cap2>*<site2>,0)')
Fi.row('subs', 'Primes et subsides d’exploitation', 'IF({N}=<sub1_m>,<sub1>,0)+IF({N}=<sub2_m>,<sub2>,0)')
loans = (1, 2, 3)
for n in loans:
    Fi.section({1: 'Prêt 1 — bancaire garanti', 2: 'Prêt 2 — Coup de pouce', 3: 'Prêt 3 — site bruxellois'}[n])
    cond = '1' if n < 3 else '<site2>'
    Fi.row('l%d_draw' % n, 'Versement', 'IF({N}=<l%d_m>,<l%d_amt>*%s,0)' % (n, n, cond))
    Fi.row('l%d_princ' % n, 'Remboursement du capital',
           'IF(AND({N}>(<l%d_m>+<l%d_grace>),[l%d_bal@p]>0.01),MIN([l%d_bal@p],<l%d_amt>/(<l%d_dur>-<l%d_grace>)),0)' % (n, n, n, n, n, n, n))
    Fi.row('l%d_int' % n, 'Intérêts', '[l%d_bal@p]*<l%d_rate>/12' % (n, n))
    Fi.row('l%d_bal' % n, 'Capital restant dû', '[l%d_bal@p]+[l%d_draw]-[l%d_princ]' % (n, n, n), agg='end')
Fi.section('Totaux')
Fi.row('draw_tot', 'Total versements', '+'.join('[l%d_draw]' % n for n in loans), total=True)
Fi.row('princ_tot', 'Total remboursements', '+'.join('[l%d_princ]' % n for n in loans), total=True)
Fi.row('int_tot', 'Total intérêts', '+'.join('[l%d_int]' % n for n in loans), total=True)
Fi.row('bal_tot', 'Total dettes financières', '+'.join('[l%d_bal]' % n for n in loans), agg='end', total=True)

# ================================================================== RÉSULTATS
Re = F.MonthlySheet(wb, 'Résultats', 'Compte de résultats mensuel', 'ISOC annuel avec report des pertes, comptabilisé en décembre.', H, START)
Re.row('ca', 'Chiffre d’affaires', '[Revenus:rev_tot]', link=True)
Re.row('sub', 'Primes et subsides', '[Financement:subs]', link=True)
Re.row('cd', 'Coûts directs', '-[Revenus:c_tot]')
Re.row('sbd', 'Frais de structure', '-[Charges:opex_tot]')
Re.row('rem', 'Rémunérations et charges sociales', '-[Personnel:pers_tot]')
Re.row('ebitda', 'EBITDA', '[ca]+[sub]+[cd]+[sbd]+[rem]', total=True)
Re.row('amort', 'Amortissements', '-[Investissements:amort_tot]')
Re.row('ebit', 'Résultat d’exploitation', '[ebitda]+[amort]', total=True)
Re.row('fin', 'Charges financières', '-[Financement:int_tot]')
Re.row('ebt', 'Résultat avant impôt', '[ebit]+[fin]', total=True)
Re.section('Impôt des sociétés (calcul annuel)')
Re.row('loss_start', 'Pertes fiscales reportées — début', None, agg='custom', ann=lambda i, col: '0' if i == 0 else '[loss_end@p]')
Re.row('base', 'Base imposable', None, agg='custom', ann='MAX(0,[ebt]-[loss_start])')
Re.row('loss_end', 'Pertes fiscales reportées — fin', None, agg='custom', ann='MAX(0,[loss_start]-[ebt])')
Re.row('isoc_calc', 'ISOC de l’année', None, agg='custom',
       ann='IF(<isoc_red_ok>=1,<isoc_low>*MIN([base],<isoc_thr>)+<isoc_std>*MAX(0,[base]-<isoc_thr>),<isoc_std>*[base])')
isoc_rng = '$C$%d:$G$%d' % (Re.rows['isoc_calc'].r, Re.rows['isoc_calc'].r)
Re.row('isoc', 'Impôt des sociétés (décembre)', 'IF({M}=12,-INDEX(%s,{Y}),0)' % isoc_rng)
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
T = F.MonthlySheet(wb, 'Trésorerie', 'Budget de trésorerie mensuel (TTC)', 'TVA trimestrielle ; ISOC payé l’année suivante.', H, START)
T.section('Encaissements')
T.row('e_ca', 'Encaissements élèves (TTC)', '[Revenus:rev_tot]*(1+<tva>)')
T.row('e_sub', 'Primes et subsides', '[Financement:subs]')
T.row('e_cap', 'Apport en capital', '[Financement:cap_in]')
T.row('e_loan', 'Emprunts', '[Financement:draw_tot]')
T.row('e_tot', 'Total encaissements', '[e_ca]+[e_sub]+[e_cap]+[e_loan]', total=True)
T.section('Décaissements')
T.row('d_direct', 'Coûts directs (TTC)', '[Revenus:c_app]*(1+<tva>)+[Revenus:car_ht]*(1+<tva>)+[Revenus:c_ins]+[Revenus:c_pay]')
T.row('d_opex', 'Frais de structure (TTC)', '[Charges:opex_tot]+[Charges:opex_vat_base]*<tva>')
T.row('d_pers', 'Rémunérations et charges sociales', '[Personnel:pers_tot]')
T.row('d_capex', 'Investissements (TTC)', '[Investissements:capex_tot]*(1+<tva>)')
T.row('d_depo', 'Garanties locatives', '[Investissements:depo_out]')
T.row('d_int', 'Intérêts', '[Financement:int_tot]')
T.row('d_princ', 'Remboursements d’emprunts', '[Financement:princ_tot]')
T.row('vat_coll', 'TVA collectée (mémo)', '[Revenus:rev_tot]*<tva>')
T.row('vat_ded', 'TVA déductible (mémo)',
      '[Revenus:c_app]*<tva>+[Revenus:car_ht]*<tva>*<vat_car>+[Charges:opex_vat_base]*<tva>+[Investissements:capex_tot]*<tva>')
T.row('vat_net', 'TVA nette du mois (mémo)', '[vat_coll]-[vat_ded]')
vr = lambda col: '%s%d' % (col, T.rows['vat_net'].r)
T.row('d_vat', 'Paiement (+) / remboursement (−) de TVA', lambda j, col: F.vat_settlement(j, vr))
isoc_rng2 = "'Résultats'!$C$%d:$G$%d" % (Re.rows['isoc_calc'].r, Re.rows['isoc_calc'].r)
T.row('d_isoc', 'Paiement de l’ISOC', 'IF(AND({M}=<isoc_pay_m>,{Y}>1),INDEX(%s,{Y}-1),0)' % isoc_rng2)
T.row('d_tot', 'Total décaissements', '[d_direct]+[d_opex]+[d_pers]+[d_capex]+[d_depo]+[d_int]+[d_princ]+[d_vat]+[d_isoc]', total=True)
T.section('Solde')
T.row('flow', 'Flux net de trésorerie', '[e_tot]-[d_tot]', total=True)
T.row('cash_start', 'Trésorerie début de mois', '[cash_end@p]', agg=None)
T.row('cash_end', 'Trésorerie fin de mois', '[cash_start]+[flow]', agg='end', total=True)
T.row('cum_nofin', 'Trésorerie cumulée sans financement externe (besoin)',
      '[cum_nofin@p]+[flow]-[e_cap]-[e_loan]-[e_sub]+[d_int]+[d_princ]', agg='end')

# ================================================================== COMPTE DE RÉSULTATS
CR = F.AnnualSheet(wb, 'Compte de résultats', 'Compte de résultats prévisionnel (schéma PCMN abrégé)',
                   'Art. 5:4 CSA : comptes de résultats projetés à 12 et 24 mois (présentés sur 5 ans).', H, START)
CR.section('Produits')
CR.row('ca', '70 — Chiffre d’affaires', '[Résultats:ca]', link=True)
CR.row('sub', '74 — Autres produits d’exploitation (primes)', '[Résultats:sub]', link=True)
CR.row('prod', 'Total des produits d’exploitation', '[ca]+[sub]', total=True)
CR.section('Charges')
CR.row('cd', '60/61 — Coûts directs (véhicules, commissions, encaissement)', '-[Résultats:cd]')
CR.row('sbd', '61 — Services et biens divers (structure)', '-[Résultats:sbd]')
CR.row('rem', '62 — Rémunérations et charges sociales', '-[Résultats:rem]')
CR.row('ebitda', 'EBITDA', '[prod]-[cd]-[sbd]-[rem]', total=True)
CR.row('ebitda_pct', 'Marge d’EBITDA', 'IF([ca]=0,0,[ebitda]/[ca])', PCT)
CR.row('amort', '630 — Amortissements', '-[Résultats:amort]')
CR.row('ebit', '9901 — Résultat d’exploitation', '[ebitda]-[amort]', total=True)
CR.row('fin', '65 — Charges financières', '-[Résultats:fin]')
CR.row('ebt', '9903 — Résultat avant impôts', '[ebit]-[fin]', total=True)
CR.row('isoc', '67 — Impôt des sociétés', '-[Résultats:isoc]')
CR.row('net', '9904 — Résultat net', '[ebt]-[isoc]', total=True)
CR.row('cum', 'Résultat cumulé', lambda col: '[net]' if col == 'C' else '[cum@p]+[net]')

# ================================================================== BILAN
TV = "'Trésorerie'!"
vat_row = T.rows['vat_net'].r
q4 = ('SUMIFS(%s$%s$%d:$%s$%d,%s$%s$5:$%s$5,{c}$5,%s$%s$6:$%s$6,">=10")'
      % (TV, L(FIRST), vat_row, LASTM, vat_row, TV, L(FIRST), LASTM, TV, L(FIRST), LASTM))
B = F.AnnualSheet(wb, 'Bilan', 'Bilans prévisionnels (fin d’exercice)', 'Art. 5:4 CSA : bilan d’ouverture et bilans projetés.', H, START, opening=True)
cap_r = Fi.rows['cap_in'].r
net_r = Re.rows['net'].r
B.section('ACTIF')
B.row('immo', 'Immobilisations corporelles (valeur nette)', '[Investissements:nbv]', open_tmpl='0', link=True)
B.row('depo', 'Garanties locatives versées', '[Investissements:depo_bal]', open_tmpl='0', link=True)
B.row('vat_rec', 'Créance de TVA', 'MAX(0,-%s)' % q4, open_tmpl='0')
B.row('cash', 'Trésorerie', '[Trésorerie:cash_end]', open_tmpl='<cap>', link=True)
B.row('assets', 'TOTAL ACTIF', '[immo]+[depo]+[vat_rec]+[cash]', open_tmpl='[immo]+[depo]+[vat_rec]+[cash]', total=True)
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
B.row('net_debt', 'Dette nette', '[debt]-[cash]')
B.row('dscr', 'Couverture du service de la dette (EBITDA / annuités)',
      "IF(('Financement'!{c}%d+'Financement'!{c}%d)=0,0,'Résultats'!{c}%d/('Financement'!{c}%d+'Financement'!{c}%d))"
      % (Fi.rows['princ_tot'].r, Fi.rows['int_tot'].r, Re.rows['ebitda'].r, Fi.rows['princ_tot'].r, Fi.rows['int_tot'].r), NUM2)

F.finalize_all()

# ================================================================== RENTABILITÉ PAR VÉHICULE
U = wb.create_sheet('Rentabilité véhicule')
U['A1'] = 'Rentabilité d’un véhicule + moniteur salarié (site wallon, an 1, HTVA, par mois)'
U['A1'].font = F.F_TITLE
U.column_dimensions['A'].width = 64
U.column_dimensions['B'].width = 16
U.column_dimensions['C'].width = 80
h = lambda k: H.ref(k)
lines = [
    ('Taux de remplissage étudié', 0.80, 'Modifiable (cellule bleue).', PCT, True),
    ('Heures-moniteur vendues', '=%s*B3' % h('h_fte'), '', NUM1, False),
    ('dont heures de leçons', '=B4/(1+%s*%s/%s)' % (h('acc_student'), h('acc_dur'), h('h_student')), '', NUM1, False),
    ('Prix horaire effectif HTVA', '=((1-%s)*%s+%s*%s)/(1+%s)' % (h('forem'), h('p_h1'), h('forem'), h('forem_h'), h('tva')), '', EUR2, False),
    ('CA leçons', '=B5*B6', '', EUR, False),
    ('CA accompagnements, théorie, dossiers', '=B5/%s*(%s*%s+%s*%s+%s)/(1+%s)' % (h('h_student'), h('acc_student'), h('p_exam'), h('theory_share'), h('p_theory'), h('p_file'), h('tva')), '', EUR, False),
    ('Chiffre d’affaires par véhicule', '=B7+B8', '', EUR, False),
    ('Coût des moniteurs (mix salariés / indépendants)', '=(1-%s)*(%s*(1+%s)*%s/12+%s)+%s*B4*%s' % (h('indep'), h('instr_gross'), h('onss'), h('mult13'), h('benefits'), h('indep'), h('indep_rate')), 'Salarié : coût employeur avant réductions ONSS ; indépendant : payé à l’heure.', EUR, False),
    ('Location du véhicule (avec TVA non déductible)', '=%s*(1+%s*(1-%s))' % (h('car_rent'), h('tva'), h('vat_car')), '', EUR, False),
    ('Assurance du véhicule', '=%s/12' % h('car_ins'), '', EUR, False),
    ('Carburant & usure', '=(B5+B5/%s*%s*%s)*(%s*%s/(1+%s)+%s)*(1+%s*(1-%s))' % (h('h_student'), h('acc_student'), h('acc_dur'), h('fuel_lh'), h('fuel_p'), h('tva'), h('wear'), h('tva'), h('vat_car')), '', EUR, False),
    ('Commission AutoSchub (part an 1)', '=%s*%s*B7' % (H.yref('app_share', '1'), h('app_comm')), '', EUR, False),
    ('Frais d’encaissement', '=B9*(1+%s)*%s' % (h('tva'), h('pay_pct')), '', EUR, False),
    ('Contribution du véhicule aux frais de structure', '=B9-SUM(B10:B15)', 'À comparer aux frais fixes de structure du site (loyer, secrétariat, marketing, directeur).', EUR, False),
    ('Taux de remplissage d’équilibre du véhicule', '=((1-%s)*(%s*(1+%s)*%s/12+%s)+B11+B12)/((B9-B13-B14-B15-%s*B4*%s)/B3)' % (h('indep'), h('instr_gross'), h('onss'), h('mult13'), h('benefits'), h('indep'), h('indep_rate')), 'Remplissage à partir duquel le véhicule couvre ses coûts fixes propres (moniteur, location, assurance).', PCT, False),
]
U['A2'] = 'Indicateur'
U['B2'] = 'Valeur'
U['C2'] = 'Commentaire'
for c in ('A2', 'B2', 'C2'):
    U[c].font = F.F_HDR
    U[c].fill = F.FILL_HDR
r = 3
for lab, v, com, fmt, inp in lines:
    U.cell(row=r, column=1, value=lab).font = F.F_TXT
    c = U.cell(row=r, column=2, value=v)
    c.font = F.F_IN if inp else F.F_CALC
    if inp:
        c.fill = F.FILL_KEY
    c.number_format = fmt
    U.cell(row=r, column=3, value=com).font = F.F_SUB
    r += 1

# ================================================================== SYNTHÈSE
S = synth_ws
S['A1'] = 'École de conduite agréée — synthèse du plan financier'
S['A1'].font = F.F_TITLE
S['A2'] = ('="Scénario "&CHOOSE(%s,"prudent","central","ambitieux")&" — site bruxellois : "&IF(%s=1,"oui (mois "&%s&")","non")&" — démarrage "&TEXT(MONTH(%s),"00")&"/"&YEAR(%s)'
           % (H.ref('scenario'), H.ref('site2'), H.ref('open2'), START, START))
S['A2'].font = F.F_SUB
S.column_dimensions['A'].width = 50
S.column_dimensions['B'].width = 3
for col in F.ANN:
    S.column_dimensions[col].width = 14
S['A4'] = 'Indicateurs clés'
S['A4'].font = F.F_HDR
S['A4'].fill = F.FILL_HDR
for col in F.ANN:
    c = S[col + '4']
    c.value = "='Compte de résultats'!%s6" % col
    c.font = F.F_HDR
    c.fill = F.FILL_HDR
    c.alignment = Alignment(horizontal='center')
kpis = [
    ('Véhicules en service (fin d’année)', "'Activité'!{c}%d" % A.rows['fleet'].r, NUM),
    ('Heures de leçons de conduite', "'Activité'!{c}%d" % A.rows['les'].r, NUM),
    ('Élèves formés (équivalent 24 h)', "'Activité'!{c}%d" % A.rows['stu'].r, NUM),
    ('Part de marché W+B (élèves / candidats)', "'Activité'!{c}%d/%s" % (A.rows['stu'].r, H.ref('mkt')), '0.00%'),
    ('Taux de remplissage moyen — site 1', "'Activité'!{c}%d" % A.rows['fill1'].r, PCT),
    ('Chiffre d’affaires (HTVA)', "'Compte de résultats'!{c}%d" % CR.rows['ca'].r, EUR),
    ('Marge brute (avant personnel)', "'Revenus'!{c}%d" % R.rows['gm'].r, EUR),
    ('EBITDA', "'Compte de résultats'!{c}%d" % CR.rows['ebitda'].r, EUR),
    ('Marge d’EBITDA', "'Compte de résultats'!{c}%d" % CR.rows['ebitda_pct'].r, PCT),
    ('Résultat net', "'Compte de résultats'!{c}%d" % CR.rows['net'].r, EUR),
    ('Trésorerie fin d’année', "'Trésorerie'!{c}%d" % T.rows['cash_end'].r, EUR),
    ('Fonds propres fin d’année', "'Bilan'!{c}%d" % B.rows['equity'].r, EUR),
    ('Dettes financières fin d’année', "'Bilan'!{c}%d" % B.rows['debt'].r, EUR),
    ('Couverture du service de la dette (DSCR)', "'Bilan'!{c}%d" % B.rows['dscr'].r, NUM2),
    ('Effectif salarié (ETP, fin d’année)', "'Personnel'!{c}%d" % P.rows['fte'].r, NUM1),
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
    ('Besoin de financement maximal (sans financement externe)', '=-MIN(0,MIN(%s))' % need_rng, EUR),
    ('Financement prévu (capital + prêts + primes)', '=%s+%s+%s+(%s+%s)*%s+%s+%s' % (h('cap'), h('l1_amt'), h('l2_amt'), h('l3_amt'), h('cap2'), h('site2'), h('sub1'), h('sub2')), EUR),
    ('Trésorerie minimale sur 60 mois', '=MIN(%s)' % cash_rng, EUR),
    ('Mois de la trésorerie minimale', '=INDEX(%s,MATCH(MIN(%s),%s,0))' % (date_rng, cash_rng, cash_rng), 'mmm-yy'),
    ('Premier mois d’EBITDA positif durable (3 mois consécutifs, hors subsides)', '=IFERROR(INDEX(%s,MATCH(1,%s,0)),"au-delà de 60 mois")' % (date_rng, flag_rng), 'mmm-yy'),
    ('Investissement total sur 5 ans (HTVA)', "='Investissements'!C%d+'Investissements'!D%d+'Investissements'!E%d+'Investissements'!F%d+'Investissements'!G%d" % ((I.rows['capex_tot'].r,) * 5), EUR),
]
for lab, f, fmt in items:
    S.cell(row=r, column=1, value=lab).font = F.F_TXT
    c = S.cell(row=r, column=3, value=f)
    c.number_format = fmt
    c.font = F.F_CALCB
    r += 1
ch = BarChart()
ch.type = 'col'
ch.title = 'Chiffre d’affaires, EBITDA et résultat net (€)'
ch.height = 7.5
ch.width = 17
for rr, name in ((10, 'CA'), (12, 'EBITDA'), (14, 'Résultat net')):
    ch.series.append(Series(Reference(S, min_col=3, max_col=7, min_row=rr, max_row=rr), title=name))
ch.set_categories(Reference(S, min_col=3, max_col=7, min_row=4, max_row=4))
S.add_chart(ch, 'I4')
lc = LineChart()
lc.title = 'Trésorerie fin de mois (€)'
lc.height = 7.5
lc.width = 17
tws = wb['Trésorerie']
lc.add_data(Reference(tws, min_col=FIRST, max_col=FIRST + NM - 1, min_row=T.rows['cash_end'].r, max_row=T.rows['cash_end'].r), from_rows=True)
lc.set_categories(Reference(tws, min_col=FIRST, max_col=FIRST + NM - 1, min_row=4, max_row=4))
lc.legend = None
S.add_chart(lc, 'I21')

import extras
extras.finish_school(wb, H, OUT)
for k, name in enumerate(['Compte de résultats', 'Bilan', 'Rentabilité véhicule']):
    wb.move_sheet(name, offset=-(wb.sheetnames.index(name) - 2 - k))
if 'Scénarios' in wb.sheetnames:
    wb.move_sheet('Scénarios', offset=-(wb.sheetnames.index('Scénarios') - wb.sheetnames.index('Rentabilité véhicule') - 1))
wb.save(OUT)
print('saved', OUT)

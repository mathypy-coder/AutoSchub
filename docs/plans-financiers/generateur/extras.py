"""Feuilles de texte (Lisez-moi, Sources) et tableau comparatif des scénarios."""
import json, os
import fplib as F
from openpyxl.styles import Alignment

EUR = F.EUR


def n(x):
    return f'{x:,.0f}'.replace(',', '\u202f')


def write_text(ws, title, blocks, width=125):
    ws.column_dimensions['A'].width = 3
    ws.column_dimensions['B'].width = width
    ws['B1'] = title
    ws['B1'].font = F.F_TITLE
    r = 3
    for style, txt in blocks:
        c = ws.cell(row=r, column=2, value=txt)
        c.font = {'h': F.F_SEC, 'b': F.F_TXTB, 's': F.F_SUB}.get(style, F.F_TXT)
        if style == 'h':
            c.fill = F.FILL_SEC
        c.alignment = Alignment(wrap_text=True, vertical='top')
        n = sum(len(line) // int(width * 1.05) + 1 for line in txt.split('\n'))
        ws.row_dimensions[r].height = max(14, 12.5 * n)
        r += 1
    ws.sheet_view.showGridLines = False


def sources_sheet(wb, rows):
    ws = wb.create_sheet('Sources')
    ws['A1'] = 'Sources et références (consultées le 04/11/2026)'
    ws['A1'].font = F.F_TITLE
    for i, h in enumerate(['Thème', 'Information retenue', 'Source']):
        c = ws.cell(row=3, column=i + 1, value=h)
        c.font = F.F_HDR
        c.fill = F.FILL_HDR
    ws.column_dimensions['A'].width = 26
    ws.column_dimensions['B'].width = 80
    ws.column_dimensions['C'].width = 90
    r = 4
    for theme, info, url in rows:
        ws.cell(row=r, column=1, value=theme).font = F.F_TXTB
        c = ws.cell(row=r, column=2, value=info)
        c.font = F.F_TXT
        c.alignment = Alignment(wrap_text=True, vertical='top')
        u = ws.cell(row=r, column=3, value=url)
        u.font = F.F_SUB
        if url.startswith('http'):
            u.hyperlink = url
        ws.row_dimensions[r].height = 13 * max(1, len(info) // 85 + 1)
        r += 1


def scen_sheet(wb, snap, labels, metrics, note):
    ws = wb.create_sheet('Scénarios')
    ws['A1'] = 'Comparaison des scénarios (valeurs figées)'
    ws['A1'].font = F.F_TITLE
    ws['A2'] = note
    ws['A2'].font = F.F_SUB
    ws.column_dimensions['A'].width = 46
    r = 4
    for key, lab in labels:
        d = snap[key]
        ws.cell(row=r, column=1, value=lab).font = F.F_SEC
        for col in range(1, 8):
            ws.cell(row=r, column=col).fill = F.FILL_SEC
        r += 1
        for i, y in enumerate(d['years']):
            c = ws.cell(row=r, column=3 + i, value=y)
            c.font = F.F_HDR
            c.fill = F.FILL_HDR
            c.alignment = Alignment(horizontal='center')
            ws.column_dimensions[F.ANN[i]].width = 14
        r += 1
        for mk, mlab, fmt in metrics:
            if mk not in d:
                continue
            ws.cell(row=r, column=1, value=mlab).font = F.F_TXT
            v = d[mk]
            if isinstance(v, list):
                for i, x in enumerate(v):
                    c = ws.cell(row=r, column=3 + i, value=x)
                    c.number_format = fmt
                    c.font = F.F_CALC
            else:
                c = ws.cell(row=r, column=3, value=v)
                c.number_format = fmt
                c.font = F.F_CALCB
            r += 1
        r += 1
    return ws


def load_snap(out):
    p = out + '.snap.json'
    return json.load(open(p)) if os.path.exists(p) else None


METRICS = [
    ('ca', 'Chiffre d’affaires HTVA', EUR),
    ('ebitda', 'EBITDA', EUR),
    ('net', 'Résultat net', EUR),
    ('cash', 'Trésorerie fin d’année', EUR),
    ('equity', 'Fonds propres fin d’année', EUR),
    ('need', 'Besoin de financement maximal', EUR),
    ('mincash', 'Trésorerie minimale (avec financement prévu)', EUR),
    ('be', 'Premier mois d’EBITDA positif', '@'),
]

# ======================================================================= APP
APP_SOURCES = [
    ('Paramètres de l’app', 'Prix des packs (9,99 / 149 / 279 €), minutes incluses (0 / 180 / 360), réductions (0 / 10 / 15 %), objectifs d’heures par catégorie, 2 examens blancs gratuits par semaine.', 'Dépôt AutoSchub : server/src/data/plans.js'),
    ('Paramètres de l’app', 'Commission plateforme 20 % ; moniteur payé au prix plein de la leçon ; tarifs des moniteurs de démonstration 50-70 €/h (moyenne 58,3 €).', 'server/src/routes/instructors.js ; server/src/seed.js ; README.md'),
    ('Marché Wallonie', '152 005 examens théoriques (37 % de réussite) et 87 162 examens pratiques (54 %) en 2025 — annexe du Parlement wallon du 06/02/2026 (intitulés corrigés).', 'https://permis.online/actualite/chiffres-permis-wallonie-2025-inverses/'),
    ('Marché Bruxelles', '53 721 examens théoriques (41 %) et ~21 000 examens pratiques (51 %) en 2024 ; ~10 700 permis obtenus.', 'https://bx1.be/categories/news/permis-de-conduire-les-examens-pratiques-mieux-reussis-a-bruxelles-quen-wallonie/'),
    ('Prix du marché', 'Heure de conduite 50-75 € (Infor Jeunes) ; forfait 20 h médian ≈ 1 647 € en Wallonie ; heure sup. médiane ≈ 70 €, à la carte ≈ 81 €.', 'https://toutpourmonpermis.be/prix-permis-de-conduire ; https://monautoecole.be/guides/prix-permis-belgique ; https://permis.online/demarches/prix/'),
    ('Réglementation', 'Formation en filière école : 20 h minimum (M18) ou 30 h (accès direct) en école agréée ; filière libre : rendez-vous pédagogique de 3 h ; 6 h obligatoires après 2 échecs pratiques.', 'https://permis-online.be/demarches/wallonie/ ; https://www.touring.be/fr/articles/obtenir-son-permis-de-conduire-b-en-wallonie'),
    ('Réglementation', 'Activités d’école de conduite réservées aux unités d’établissement d’une école agréée (AR 11/05/2004). Arrêt du Conseil d’État (2014) ayant permis aux moniteurs indépendants de reprendre leurs activités.', 'https://wallex.wallonie.be/contents/acts/9/9055/1.html ; https://rtbf.be/info/belgique/detail_les-moniteurs-independants-peuvent-a-nouveau-donner-des-cours-de-conduite?id=8283372'),
    ('Concurrence', 'Benjago (mise en relation avec moniteurs indépendants, 2016), ClickClickDrive (comparateur de 250+ auto-écoles), Superprof / Pwiic (moniteurs dès 20-25 €/h).', 'https://www.lalibre.be/economie/entreprises-startup/2016/04/20/un-site-pour-rencontrer-le-moniteur-automobile-de-conduite-de-ses-reves-G4XTJYDZDVHH3BABC4WX6KOWHY/ ; https://www.clickclickdrive.be/ ; https://www.superprof.be/cours/conduite/belgique/'),
    ('Paiement', 'Mollie Bancontact : 1,40 % + 0,25 € par transaction.', 'https://www.mollie.com/payments/bancontact'),
    ('Fiscalité', 'ISOC 20 % sur 100 000 € (PME) / 25 % ; rémunération minimale du dirigeant 50 000 € ; cotisations indépendant 20,5 %, minimum ≈ 890 €/trimestre.', 'https://www.myfid.be/ressources/comptabilite/taux-reduit-isoc/ ; https://www.ucm.be/actualites/tout-savoir-sur-le-calcul-de-vos-cotisations-sociales'),
    ('Fiscalité', 'Tax shelter start-up : réduction d’impôt de 45 % (micro) ou 30 % (petite), plafond 100 000 €/an/personne, société de moins de 4 ans.', 'https://fin.belgium.be/fr/particuliers/avantages-fiscaux/investir-start-up-scale-up-tax-shelter'),
    ('Social', 'Réduction ONSS : 2 000 €/trim. sans limite pour le 1er travailleur, 1 000 €/trim. pendant 12 trimestres pour les 2e à 5e (au 01/07/2026) ; cotisations patronales ≈ 25 %.', 'https://www.securex.be/fr/premier-engagement/couts-a-prevoir/reduction-groupe-cible ; https://www.myfid.be/calculateur/cout-employe/'),
    ('Salaires tech', 'Développeur full-stack : ≈ 4 200 €/mois brut (Indeed BE) ; freelance 450-850 €/jour.', 'https://emplois.be.indeed.com/career/full-stack-developer/salaries ; https://salaireclair.fr/blog/salaire-developpeur-belgique-2026'),
    ('Aides', 'Chèques-entreprises wallons (conseil/formation à la création) ; prêts Wallonie Entreprendre (garantie jusqu’à 75 %) ; finance&invest.brussels (prêts, participations) ; Innoviris : pas de nouveaux projets financés en 2026 dans plusieurs programmes.', 'https://www.cheques-entreprises.be ; https://www.wallonie-entreprendre.be ; https://www.finance.brussels ; https://www.innoviris.brussels/program/innovation-vouchers-start-ai'),
    ('Droit des sociétés', 'Plan financier obligatoire à la constitution d’une SRL (art. 5:4 CSA) : description de l’activité, sources de financement, bilan d’ouverture et projetés à 12 et 24 mois, comptes de résultats projetés, budget des revenus et dépenses sur 2 ans minimum, hypothèses.', 'Code des sociétés et des associations, art. 5:4'),
]


def finish_app(wb, H, out):
    snap = load_snap(out)
    ws = wb['Lisez-moi']
    key = ''
    if snap:
        c = snap['c']
        g = snap['g2']
        gb = snap['g2b']
        key = (f"Scénario central, grille actuelle de l’app : CA de {n(c['ca'][0])} € (an 1) à {n(c['ca'][4])} € (an 5) ; "
               f"EBITDA an 5 : {n(c['ebitda'][4])} € ; besoin de financement maximal : {n(c['need'])} € ; premier mois d’EBITDA positif : {c['be']}.\n"
               f"Avec la grille recommandée : EBITDA an 5 : {n(g['ebitda'][4])} € ; besoin : {n(g['need'])} € ; premier mois d’EBITDA positif : {g['be']}.\n"
               f"Avec la grille recommandée + abonnements écoles partenaires : EBITDA an 5 : {n(gb['ebitda'][4])} € ; besoin : {n(gb['need'])} € ; premier mois d’EBITDA positif : {gb['be']}.\n"
               f"Plan d’action complet (+ commission portée à 25 %) : EBITDA an 5 : {n(snap['act']['ebitda'][4])} € ; besoin : {n(snap['act']['need'])} € ; premier mois d’EBITDA positif : {snap['act']['be']}.\n"
               f"Scénario prudent (grille actuelle) : besoin {n(snap['p']['need'])} € ; scénario ambitieux : besoin {n(snap['o']['need'])} €, premier mois d’EBITDA positif : {snap['o']['be']}.")
    blocks = [
        ('p', 'Plan financier prévisionnel sur 5 ans (60 mois, janvier 2027 – décembre 2031) de la plateforme AutoSchub — « le Uber de l’auto-école » — '
              'pour la Wallonie et la Région de Bruxelles-Capitale. Toutes les valeurs sont calculées par formules à partir de l’onglet « Hypothèses » : '
              'modifier une cellule bleue met tout le plan à jour.'),
        ('h', '1. L’activité'),
        ('p', 'Application mobile (PWA) qui met en relation des élèves et des moniteurs pour les permis motorisés belges (focalisation financière sur le permis B). '
              'Revenus : (1) commission de 20 % sur les leçons réservées ; (2) packs mensuels Théorie 9,99 €, Conduite 149 € (3 h incluses, -10 % sur les heures sup.) et '
              'Intégral 279 € (6 h incluses, -15 %) ; (3) marge sur les heures supplémentaires des abonnés ; (4) en option, abonnement des écoles partenaires. '
              'Le moniteur est toujours payé au prix plein de la leçon, déduction faite de la commission.'),
        ('h', '2. Résultats clés'),
        ('p', key or 'Voir l’onglet « Synthèse ».'),
        ('h', '3. Constats importants (à traiter avant le lancement)'),
        ('b', 'a) Cadre réglementaire des leçons'),
        ('p', 'En Wallonie et à Bruxelles, les heures qui comptent pour la formation officielle (20 h en filière école / permis provisoire M18, 30 h en accès direct, '
              '6 h après deux échecs, rendez-vous pédagogique de 3 h) doivent être données par une école de conduite agréée. Les moniteurs indépendants hors école '
              'existent (arrêt du Conseil d’État de 2014, Superprof, Pwiic…) mais ne délivrent pas d’attestation : ils servent surtout la filière libre et le perfectionnement. '
              'Recommandation : un double canal dans l’app — écoles agréées partenaires (dont l’auto-école du plan 2) pour les heures officielles, moniteurs indépendants '
              'brevetés pour la filière libre — avec un affichage clair, et un avis écrit du SPW Mobilité et de Bruxelles Mobilité avant le lancement.'),
        ('b', 'b) TVA et marge des packs'),
        ('p', 'Avec la grille actuelle, AutoSchub vend les heures en son propre nom : la TVA de 21 % porte sur tout le prix du pack et l’élève paie l’heure incluse '
              '49,67 € (Conduite) ou 46,50 € (Intégral), soit moins que le tarif à la carte (58 €). La contribution par abonné-mois est faible (≈ 17 € et ≈ 19 €) et devient '
              'négative si l’élève consomme toutes ses heures (≈ -1 € et ≈ -18 €). Grille recommandée (onglet « Unit economics ») : un abonnement de service soumis à TVA '
              '(19,99 € / 29,99 €) + des crédits d’heures vendus au nom et pour compte des moniteurs (réduction de 10 % / 15 % conservée) : seule la marge est soumise à TVA. '
              'À valider par un fiscaliste (statut d’intermédiaire transparent, art. 13 et 20 CTVA).'),
        ('b', 'c) Le modèle a besoin de volume'),
        ('p', 'Une commission de 20 % prélevée sur un prix TTC laisse ≈ 9,6 € HTVA par heure. Avec une équipe resserrée (2 fondateurs + 6 salariés en an 5), '
              'l’équilibre demande de l’ordre de 85 000 à 100 000 heures réservées par an, soit 15 à 18 % des candidats wallons et bruxellois. Leviers : grille recommandée, '
              'abonnement des écoles partenaires, partenariats Forem / Actiris / mutualités (chèques permis), extension aux catégories A, C et D, puis à la Flandre.'),
        ('b', 'd) Autres points'),
        ('p', 'Paiement aujourd’hui simulé → intégrer Mollie (Bancontact pour le premier paiement, prélèvement SEPA pour les renouvellements). '
              'RGPD : géolocalisation en temps réel et élèves de 17 ans → analyse d’impact (AIPD) et DPO. Statut des moniteurs : indépendants (contrat-cadre, assurance '
              'auto-école à vérifier à chaque inscription, contrôle du brevet et de l’extrait 596.1). Fonds propres : prévoir les levées avant que les capitaux propres '
              'ne deviennent négatifs (sonnette d’alarme et test de liquidité du CSA).'),
        ('h', '4. Organisation du classeur'),
        ('p', 'Synthèse (indicateurs et graphiques) · Compte de résultats · Bilan · Unit economics (rentabilité par produit et comparaison des deux grilles) · '
              'Hypothèses (toutes les entrées, sourcées) · Activité (élèves, abonnés, heures, moniteurs) · Revenus (CA et coûts directs) · Personnel · Charges · '
              'Investissements · Financement · Résultats (mensuel, ISOC) · Trésorerie (mensuelle, TVA trimestrielle) · Scénarios (valeurs figées) · Sources.'),
        ('p', 'Feuilles mensuelles : colonnes C à G = totaux annuels (ou valeurs de fin d’année), puis les 60 mois à partir de la colonne I.'),
        ('h', '5. Code couleur'),
        ('p', 'Bleu = hypothèse saisie · Fond jaune = hypothèse clé · Noir = formule · Vert = lien vers une autre feuille · Fond gris = total. '
              'Montants en euros hors TVA (sauf trésorerie, en TTC). Négatifs entre parenthèses.'),
        ('h', '6. Conformité au plan financier de l’art. 5:4 du CSA (constitution d’une SRL)'),
        ('p', '1° Description précise de l’activité : section 1 ci-dessus.  2° Sources de financement : onglet « Financement ».  3° Bilan d’ouverture et bilans projetés '
              'à 12 et 24 mois : onglet « Bilan » (5 ans).  4° Comptes de résultats projetés à 12 et 24 mois : onglet « Compte de résultats ».  5° Budget des revenus et '
              'dépenses sur au moins 2 ans : onglet « Trésorerie » (60 mois).  6° Hypothèses retenues : onglet « Hypothèses ».  7° Nom de l’expert éventuel : à compléter '
              '(expert-comptable certifié ITAA recommandé). Le plan est remis au notaire ; en cas de faillite dans les 3 ans, il peut servir à apprécier la responsabilité '
              'des fondateurs pour capitaux propres manifestement insuffisants : d’où le choix d’hypothèses prudentes.'),
        ('h', '7. Mode d’emploi'),
        ('p', 'Changer de scénario : Hypothèses › « Scénario actif » (1, 2 ou 3). Tester la grille recommandée : « Grille tarifaire » = 2. Activer l’offre écoles : '
              'ligne « Écoles de conduite partenaires abonnées ». Le contrôle du bilan (Synthèse, dernière ligne) doit toujours afficher 0.'),
        ('h', '8. Limites'),
        ('s', 'Les créances clients et dettes fournisseurs sont supposées nulles (paiement immédiat) ; les encaissements reversés aux moniteurs (leçons à la carte, crédits '
              'de la grille 2) sont neutres et non représentés ; l’ISOC est payé l’année suivante sans versements anticipés ; les chiffres de marché proviennent de réponses '
              'parlementaires relayées par la presse et des comparateurs privés (à recouper avec le SPW Mobilité et Bruxelles Mobilité). Ce document est une aide à la '
              'décision et ne remplace pas l’avis d’un expert-comptable, d’un fiscaliste ou d’un avocat.'),
    ]
    write_text(ws, 'AutoSchub — plan financier de l’application (Wallonie & Bruxelles)', blocks)
    sources_sheet(wb, APP_SOURCES)
    if snap:
        scen_sheet(wb, snap, [('p', 'Scénario prudent — grille actuelle'), ('c', 'Scénario central — grille actuelle (référence)'),
                              ('o', 'Scénario ambitieux — grille actuelle'), ('g2', 'Scénario central — grille recommandée'),
                              ('g2b', 'Scénario central — grille recommandée + abonnements écoles partenaires (15 → 70 écoles)'),
                              ('act', 'Scénario central — plan d’action complet : grille recommandée + écoles partenaires + commission 25 %')],
                   METRICS, 'Résultats recalculés pour chaque jeu d’hypothèses puis figés (le classeur ne recalcule qu’un scénario à la fois : '
                            'changer « Scénario actif » et « Grille tarifaire » dans Hypothèses pour explorer).')


# ======================================================================= SCHOOL
SCHOOL_SOURCES = [
    ('Agrément', 'AR du 11/05/2004 relatif aux conditions d’agrément des écoles de conduite (modifié, dont AR du 28/11/2024) : directeur unique par école, locaux (salle de cours, sanitaire, accueil, administration ; pas dans un débit de boissons ni une habitation), matériel didactique, terrain non exigé pour la catégorie B, assurance de chaque véhicule.', 'https://wallex.wallonie.be/contents/acts/9/9055/1.html ; https://www.codedelaroute.be/fr/reglementation/2004014097~nnsk8vvfl5'),
    ('Agrément Wallonie', 'Compétence régionale (SPW Mobilité et Infrastructures) ; demande d’agrément et fiches du personnel ; extrait de casier 596.1 « auto-école ».', 'https://infrastructures.wallonie.be/fr/demandes/4084_obtenir-un-agrement-d-ecole-de-conduite.html ; https://wallonie.be/fr/demarches/obtenir-une-autorisation-de-diriger-une-ecole-de-conduite-agreee'),
    ('Agrément Bruxelles', 'Bruxelles Mobilité : agrément 345 €, modification substantielle 182 €, redevance annuelle 182 € par unité d’établissement (2026), formulaire AE001.', 'https://be.brussels/fr/node/1818'),
    ('Brevets', 'Brevet I (directeur) : diplôme secondaire ou 6 ans d’expérience, brevets II et III depuis 3 ans, permis B depuis 3 ans ; examens écrit, oral et leçon modèle.', 'https://mobilite.wallonie.be/home/je-suis/une-ecole-de-conduite/brevet-daptitude.html ; https://www.wallonie.be/fr/demarches/demande-dinscription-aux-examens-pour-obtenir-un-brevet-daptitude-professionnelle-en-ecole-de-conduite'),
    ('Formation', '20 h minimum en filière école (M18) ; 30 h en accès direct ; rendez-vous pédagogique 3 h (filière libre) ; 6 h après 2 échecs pratiques ; 12 h théoriques après 2 échecs théoriques. Suppression de la formation premiers secours à Bruxelles (15/08/2026).', 'https://permis-online.be/demarches/wallonie/ ; https://www.codedelaroute.be/fr/nieuws/suppression-de-la-formation-obligatoire-aux-premiers-secours-en-region-bruxelloise-pour-les-candidats-au-permis-b~kzyvv0ye8r'),
    ('Prix', 'Prix libres ; heure 50-75 € (Infor Jeunes) ; forfait 20 h médian ≈ 1 647 € en Wallonie ; heure sup. médiane ≈ 70 € ; à la carte ≈ 81 € ; écoles sociales 45 €/h ; mutualités 35-45 €/h.', 'https://toutpourmonpermis.be/prix-permis-de-conduire ; https://permis.online/prix-permis-de-conduire-belgique/ ; https://www.rtbf.be/article/10-astuces-pour-payer-moins-cher-son-permis-de-conduire-11210081'),
    ('Aides élèves', 'Chèque permis pratique du Forem (AGW 18/12/2025) : 30 h B financées, plafond 2 004 € TTC ; demandeurs d’emploi et travailleurs titres-services domiciliés en Wallonie francophone.', 'https://www.leforem.be/a-propos/projets-passeport-drive.html ; https://www.mutuellesante.be/remboursement-mutuelle/permis-conduire/'),
    ('Marché', 'Wallonie 2025 : 87 162 examens pratiques (54 %) ; Bruxelles 2024 : ~21 000 examens pratiques (51 %).', 'https://permis.online/actualite/chiffres-permis-wallonie-2025-inverses/ ; https://bx1.be/categories/news/permis-de-conduire-les-examens-pratiques-mieux-reussis-a-bruxelles-quen-wallonie/'),
    ('Salaires', 'Moniteur : CP 140.03, 2 100-2 400 € brut débutant, 2 800-3 200 € expérimenté.', 'https://www.trajektoire.be/metiers/instructeur-instructeur-auto-ecole'),
    ('Véhicules', 'Assurance auto-école spécifique (RC, élèves, équipements double commande) ; frais de voiture d’auto-école restant entièrement déductibles à l’impôt (exception du régime 2026).', 'https://www.solidas.be/assurance-auto-ecole-moniteur ; https://www.liantis.be/fr/nouvelles/fiscalit%C3%A9-automobile-en-2026-qu%E2%80%99est-ce-qui-change-pour-les-entrepreneurs'),
    ('Carburant', 'Prix maximum SPF Économie 2026 : essence E10 ≈ 1,87-1,99 €/l, diesel 2,21-2,51 €/l.', 'https://www.parismatch.be/actualites/economie/2026/10/27/nouveau-reocrd-a-la-pompe-le-prix-du-diesel-grimpe-encore-NZP24KSIY5H5ZIA4ZUD4NRTGJ4/'),
    ('TVA', 'Pas d’exonération identifiée pour une école commerciale (art. 44 CTVA : enseignement sans but de lucre) ; propositions de loi pour un taux de 6 % non adoptées.', 'https://www.dekamer.be/FLWB/PDF/55/0718/55K0718001.pdf ; https://www.monastucesetconseils.be/2022-02/enseignement-tout-n-est-pas-exempte-de-tva-WATTVAAR_EU09090801'),
    ('Fiscalité & social', 'ISOC 20 %/25 % ; cotisations patronales ≈ 25 % ; réductions premiers engagements (2 000 €/trim. 1er travailleur ; 1 000 €/trim. 2e-5e).', 'https://www.myfid.be/ressources/comptabilite/taux-reduit-isoc/ ; https://www.securex.be/fr/premier-engagement/couts-a-prevoir/reduction-groupe-cible'),
    ('Financement', 'Garantie Wallonie Entreprendre jusqu’à 75 % ; Prêt Coup de pouce ; prime Airbag (Forem) ; finance&invest.brussels ; tax shelter start-up 30/45 %.', 'https://www.wallonie-entreprendre.be ; https://www.myfid.be/ressources/creation-entreprise/aides-primes-subsides-creation-entreprise-wallonie/ ; https://www.finance.brussels ; https://fin.belgium.be/fr/particuliers/avantages-fiscaux/investir-start-up-scale-up-tax-shelter'),
    ('Rentabilité secteur', 'Ordres de grandeur : marge nette 10-22 % pour une école bien gérée ; coût d’un moniteur salarié 2 500-3 500 €/mois (source non spécifique à la Belgique).', 'https://modelesdebusinessplan.com/blogs/infos/ouvrir-auto-ecole-rentable'),
]


def finish_school(wb, H, out):
    snap = load_snap(out)
    ws = wb['Lisez-moi']
    key = ''
    if snap:
        c, p, o, s1 = snap['c'], snap['p'], snap['o'], snap['s1']
        key = (f"Scénario central (site wallon en avril 2027 + site bruxellois en janvier 2029) : CA de {n(c['ca'][0])} € (an 1) à {n(c['ca'][4])} € (an 5) ; "
               f"EBITDA an 5 : {n(c['ebitda'][4])} € ; résultat net an 5 : {n(c['net'][4])} € ; premier mois d’EBITDA positif : {c['be']} ; "
               f"besoin de financement maximal : {n(c['need'])} €.\n"
               f"Site wallon seul : EBITDA an 5 : {n(s1['ebitda'][4])} €, besoin : {n(s1['need'])} €.\n"
               f"Scénario prudent : EBITDA an 5 : {n(p['ebitda'][4])} € ; scénario ambitieux : EBITDA an 5 : {n(o['ebitda'][4])} €.")
    blocks = [
        ('p', 'Plan financier prévisionnel sur 5 ans (janvier 2027 – décembre 2031) pour la création d’une école de conduite agréée (permis B) : un premier site en '
              'Wallonie (Namur, Charleroi ou Liège), puis un second site à Bruxelles. Toutes les valeurs sont calculées à partir de l’onglet « Hypothèses ».'),
        ('h', '1. L’activité'),
        ('p', 'École de conduite agréée : leçons pratiques B en véhicules à double commande (filière école 20 h, accès direct 30 h, heures après échec), '
              'accompagnement à l’examen pratique, cours théoriques en salle, rendez-vous pédagogique de la filière libre (Wallonie), élèves financés par le chèque permis du Forem. '
              'L’école est partenaire agréé de l’app AutoSchub (plan 1) : une partie des élèves arrive par l’app (commission de 20 %), et l’app peut proposer des heures '
              'qui comptent pour la formation officielle.'),
        ('h', '2. Résultats clés'),
        ('p', key or 'Voir l’onglet « Synthèse ».'),
        ('h', '3. Conditions d’agrément à réunir (Wallonie et Bruxelles)'),
        ('p', '• Société (SRL) avec au moins une unité d’établissement ; agrément régional distinct pour chaque Région (SPW Mobilité ; Bruxelles Mobilité : 345 € + 182 €/an/unité).\n'
              '• Directeur titulaire du brevet I (brevets II et III depuis 3 ans, permis B depuis 3 ans, diplôme secondaire ou 6 ans d’expérience) ; un seul directeur par école, '
              'qui ne peut diriger qu’une école ; encadrement de la seconde unité par un directeur adjoint (prévu au plan).\n'
              '• Moniteurs titulaires d’une autorisation d’enseigner (brevet), agréés comme membres du personnel (fiche, permis, extrait 596.1).\n'
              '• Locaux : salle de cours avec matériel didactique (tableaux, schémas, maquettes), espace sanitaire, accueil, administration ; interdits dans un débit de '
              'boissons ou une habitation.\n'
              '• Véhicules à double commande avec panneau « auto-école », assurance spécifique pour chaque véhicule ; terrain d’entraînement non exigé pour la catégorie B.\n'
              '• Contrat écrit avec chaque élève et affichage des tarifs.'),
        ('h', '4. Calendrier de lancement'),
        ('p', 'Mois 1 (janv. 2027) : constitution de la SRL, plan financier chez le notaire, ouverture des crédits. Mois 2 : bail, dossier d’agrément, aménagement. '
              'Mois 3 : recrutement des moniteurs, véhicules en renting, marketing de lancement. Mois 4 (avril 2027) : ouverture du site wallon. '
              'Mois 23-24 : financement et augmentation de capital du site bruxellois, dossier d’agrément à Bruxelles. Mois 25 (janv. 2029) : ouverture à Bruxelles.'),
        ('h', '5. Facteurs clés de succès et risques'),
        ('p', '• Remplissage des véhicules : sous ≈ 50 % de remplissage, un véhicule ne couvre plus ses coûts propres (onglet « Rentabilité véhicule »).\n'
              '• Pénurie de moniteurs brevetés : le plan mixe 50 % de salariés et 50 % d’indépendants payés à l’heure (coût variable) ; risque de requalification à encadrer.\n'
              '• Prix : concurrence des écoles sociales (45 €/h) et des mutualités (35-45 €/h) ; positionnement à 75 € (Wallonie) et 80 € (Bruxelles).\n'
              '• TVA : 21 % appliqués ; un ruling (Service des Décisions Anticipées) est conseillé. La TVA sur les véhicules est limitée à 50 % par prudence.\n'
              '• Bruxelles : loyers élevés, zone de basses émissions (véhicules récents ou électriques ; prévoir une voiture automatique), trafic, taux de réussite plus faible (51 %).\n'
              '• Fonds propres : les pertes de démarrage rendent les capitaux propres négatifs ; l’augmentation de capital prévue au mois 24 et les prêts subordonnés '
              'limitent ce risque (sonnette d’alarme, art. 5:153 CSA).\n'
              '• Réglementation mouvante (réformes régionales du permis) et délais d’examen dans les centres (AutoSécurité, GOCA).'),
        ('h', '6. Organisation du classeur'),
        ('p', 'Synthèse · Compte de résultats · Bilan · Rentabilité véhicule (point mort par véhicule) · Hypothèses · Activité (capacité, remplissage, heures, élèves par site) · '
              'Revenus · Personnel · Charges · Investissements · Financement · Résultats (mensuel, ISOC) · Trésorerie · Scénarios (valeurs figées) · Sources. '
              'Feuilles mensuelles : colonnes C à G = totaux annuels, puis les 60 mois à partir de la colonne I.'),
        ('h', '7. Code couleur'),
        ('p', 'Bleu = hypothèse saisie · Fond jaune = hypothèse clé · Noir = formule · Vert = lien vers une autre feuille · Fond gris = total. Montants en euros HTVA '
              '(trésorerie en TTC). Négatifs entre parenthèses.'),
        ('h', '8. Conformité au plan financier de l’art. 5:4 du CSA'),
        ('p', 'Description de l’activité (sections 1 et 3) · sources de financement (« Financement ») · bilan d’ouverture et bilans projetés (« Bilan ») · comptes de résultats '
              'projetés (« Compte de résultats ») · budget des revenus et dépenses sur 60 mois (« Trésorerie ») · hypothèses (« Hypothèses ») · nom de l’expert éventuel : à compléter.'),
        ('h', '9. Mode d’emploi'),
        ('p', 'Hypothèses › « Scénario actif » (1, 2, 3) ; « Ouverture d’un site 2 à Bruxelles » (1/0) et son mois ; flotte par site et par année ; part de moniteurs indépendants. '
              'Le contrôle du bilan (Synthèse) doit toujours afficher 0.'),
        ('h', '10. Limites'),
        ('s', 'Paiement des élèves supposé comptant (pas de créances) ; véhicules en renting (pas d’achat) ; réductions ONSS approximées ; ISOC payé l’année suivante. '
              'Les prix, salaires et loyers sont des estimations à confirmer par des devis (loueurs, assureurs, bailleurs). Aide à la décision ne remplaçant pas l’avis '
              'd’un expert-comptable, d’un fiscaliste ou d’un avocat.'),
    ]
    write_text(ws, 'Création d’une école de conduite agréée — plan financier (Wallonie & Bruxelles)', blocks)
    sources_sheet(wb, SCHOOL_SOURCES)
    if snap:
        scen_sheet(wb, snap, [('p', 'Scénario prudent (2 sites)'), ('c', 'Scénario central (2 sites, référence)'),
                              ('o', 'Scénario ambitieux (2 sites)'), ('s1', 'Scénario central — site wallon seul')],
                   METRICS, 'Résultats recalculés pour chaque jeu d’hypothèses puis figés (changer « Scénario actif » et « Ouverture d’un site 2 » dans Hypothèses pour explorer).')

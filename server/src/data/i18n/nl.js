// Nederlandse vertaling (Belgisch-Nederlands) van de brontekst in het Frans.
// Sleutels van `errors` en `themes` / `skillGroups` zijn de Franse bronteksten (exact).
export default {
  skillLabels: {
    'Attelage d’outils et de remorque': 'Werktuigen en aanhangwagen aan- en afkoppelen',
    'Gabarit et signalisation du convoi agricole': 'Afmetingen en signalisatie van het landbouwkonvooi',
    'Marche arrière avec remorque': 'Achteruitrijden met aanhangwagen',
  },
  permitGroups: {
    'deux-roues': 'Tweewielers',
    voiture: 'Auto',
    'poids-lourd': 'Vrachtwagens',
    bus: 'Bussen & autocars',
    agricole: 'Landbouw',
  },

  permits: {
    AM: {
      label: 'Bromfiets',
      description: 'Bromfietsen (max. 45 km/u), lichte vierwielers en speed pedelecs.',
    },
    A1: {
      label: 'Lichte motorfiets',
      description: 'Motorfietsen tot 125 cm³ en 11 kW.',
    },
    A2: {
      label: 'Middelzware motorfiets',
      description: 'Motorfietsen tot 35 kW.',
    },
    A: {
      label: 'Motorfiets',
      description: 'Alle motorfietsen (rechtstreeks vanaf 24 jaar, of na 2 jaar A2).',
    },
    B: {
      label: 'Auto',
      description: 'Voertuigen tot 3,5 t en 8 passagiers. Voorlopig rijbewijs mogelijk vanaf 17 jaar.',
    },
    BE: {
      label: 'Auto + aanhangwagen',
      description: 'Auto met een aanhangwagen van meer dan 750 kg.',
    },
    C1: {
      label: 'Lichte vrachtwagen',
      description: 'Vrachtwagens van 3,5 t tot 7,5 t.',
    },
    C1E: {
      label: 'Lichte vrachtwagen + aanhangwagen',
      description: 'C1 met een aanhangwagen van meer dan 750 kg (totale MTM ≤ 12 t).',
    },
    C: {
      label: 'Vrachtwagen',
      description: 'Vrachtwagens van meer dan 3,5 t (21 jaar, 18 jaar met vakbekwaamheid).',
    },
    CE: {
      label: 'Oplegger',
      description: 'Vrachtwagen met een aanhangwagen van meer dan 750 kg.',
    },
    D1: {
      label: 'Minibus',
      description: 'Tot 16 passagiers, max. 8 m lang.',
    },
    D1E: {
      label: 'Minibus + aanhangwagen',
      description: 'D1 met een aanhangwagen van meer dan 750 kg.',
    },
    D: {
      label: 'Bus / autocar',
      description: 'Meer dan 8 passagiers (24 jaar, 21 jaar met vakbekwaamheid).',
    },
    DE: {
      label: 'Bus + aanhangwagen',
      description: 'Bus met een aanhangwagen van meer dan 750 kg.',
    },
    G: {
      label: 'Landbouwtrekker',
      description: 'Land- en bosbouwtrekkers, zelfrijdende landbouwmachines.',
    },
  },

  theoryCategories: {
    AM: 'Bromfiets (AM)',
    A: 'Motorfiets (A1, A2, A)',
    B: 'Auto (B, BE)',
    C: 'Vrachtwagens (C1, C, CE)',
    D: 'Bus (D1, D, DE)',
    G: 'Trekker (G)',
  },

  plans: {
    libre: {
      name: 'Vrije begeleiding',
      tagline: 'Theorie + begeleider: leer rijden met iemand die je kent, wij begeleiden je',
      features: [
        'Alles van het Theoriepakket + onbeperkte AI-coach',
        'Gids vrije begeleiding volgens je gewest (M36, termijnen, begeleider)',
        'Oefenroutes rond je examencentrum',
        'Digitaal logboek (km, omstandigheden, begeleiders)',
        '-20 % op controlelessen met een instructeur',
      ],
    },
    theorie: {
      name: 'Theorie',
      tagline: 'Om je theorie-examen te halen',
      features: [
        'Onbeperkt proefexamens',
        'Opvolging van je traject tot aan het rijbewijs',
        'Geschiedenis en gedetailleerde verbeteringen',
      ],
    },
    conduite: {
      name: 'Rijlessen',
      tagline: 'Theorie + praktijk, op je eigen tempo',
      features: [
        'Alles uit het pakket Theorie',
        '3 u rijles inbegrepen per maand',
        '-10 % op extra uren',
        'Herinneringen aan stappen en urendoelen',
      ],
    },
    integral: {
      name: 'Integraal',
      tagline: 'Volledige begeleiding tot aan het rijbewijs',
      features: [
        'Alles uit het pakket Rijlessen',
        '6 u rijles inbegrepen per maand',
        '-15 % op extra uren',
        'Vaste rijinstructeur die je vooruitgang opvolgt',
        'Gerichte voorbereiding op het praktijkexamen',
      ],
    },
  },

  skills: {
    // Gemeenschappelijk
    installation: 'Installatie, afstellingen en controles',
    observation: 'Observatie, spiegels en dode hoeken',
    placement: 'Plaats op de rijbaan',
    vitesse: 'Aangepaste snelheid en veiligheidsafstand',
    priorites: 'Voorrang en kruispunten',
    'ronds-points': 'Rotondes',
    usagers: 'Voetgangers, fietsers en kwetsbare weggebruikers',
    'changement-bande': 'Van rijstrook wisselen en inhalen',
    signalisation: 'Naleving van de verkeerstekens',
    // Auto
    'demarrage-cote': 'Hellingproef',
    creneau: 'Achteruit parkeren tussen twee voertuigen (file parkeren)',
    'marche-arriere': 'Achteruitrijden in rechte lijn / in een bocht',
    'demi-tour': 'Keren',
    autoroute: 'Autosnelweg: invoegen, ritsen, reddingsstrook',
    'eco-conduite': 'Zuinig en soepel rijden',
    // Tweewielers
    equipement: 'Beschermende uitrusting',
    'maniabilite-lente': 'Wendbaarheid aan lage snelheid',
    slalom: 'Slalom en uitwijken',
    'freinage-urgence': 'Noodstop',
    trajectoire: 'Rijlijnen in bochten',
    // Zware voertuigen
    verifications: 'Technische controles van het voertuig',
    gabarit: 'Afmetingen en dode hoeken van het zware voertuig',
    'mise-a-quai': 'Achteruitrijden en aan de laadkade plaatsen',
    attelage: 'Aankoppelen en afkoppelen',
    chargement: 'Veilig laden / passagiers veilig vervoeren',
  },

  skillGroups: {
    'Avant de partir': 'Voor vertrek',
    Circulation: 'In het verkeer',
    Maniement: 'Voertuigbeheersing',
    'Manœuvres': 'Manoeuvres',
    Plateau: 'Oefenterrein',
  },

  skillLevels: {
    0: 'Niet behandeld',
    1: 'Behandeld',
    2: 'In vooruitgang',
    3: 'Beheerst',
  },

  themes: {
    'Priorités': 'Voorrang',
    Vitesse: 'Snelheid',
    'Alcool & drogues': 'Alcohol & drugs',
    'Équipement': 'Uitrusting',
    'Arrêt & stationnement': 'Stilstaan & parkeren',
    'Usagers vulnérables': 'Kwetsbare weggebruikers',
    'Dépassement': 'Inhalen',
    Signalisation: 'Verkeerstekens',
    'Éclairage': 'Verlichting',
    Accident: 'Ongeval',
    Comportement: 'Rijgedrag',
    Moto: 'Motorfiets',
    Cyclomoteur: 'Bromfiets',
    'Temps de conduite': 'Rijtijden',
    'Angles morts': 'Dode hoeken',
    Documents: 'Documenten',
    Passagers: 'Passagiers',
    Tracteur: 'Trekker',
  },

  questions: {
    // ——— Voorrang ———
    'prio-1': {
      question: 'Wie heeft voorrang op een kruispunt zonder verkeerstekens?',
      choices: ['Het voertuig dat van links komt', 'Het voertuig dat van rechts komt', 'Het snelste voertuig'],
      explanation: 'Zonder verkeerstekens geldt voorrang van rechts.',
    },
    'prio-2': {
      question: 'Een driehoekig bord met de punt naar beneden en een rode rand (B1). Wat moet je doen?',
      choices: ['Voorrang verlenen', 'Verplicht stoppen', 'Niets, ik heb voorrang'],
      explanation: 'Het bord B1 verplicht je voorrang te verlenen aan de bestuurders op de weg die je nadert.',
    },
    'prio-3': {
      question: 'Het STOP-bord (B5) verplicht je om:',
      choices: [
        'Te vertragen en voorrang te verlenen',
        'Volledig te stoppen en daarna voorrang te verlenen',
        'Alleen te stoppen als er een voertuig aankomt',
      ],
      explanation: 'Stoppen is verplicht, ook als de weg vrij lijkt.',
    },
    'prio-4': {
      question: 'Je rijdt een parking af om de rijbaan op te rijden. Je moet:',
      choices: ['Voorrang verlenen aan alle weggebruikers', 'Voorrang van rechts toepassen', 'Claxonneren en doorrijden'],
      explanation: 'Wie een manoeuvre uitvoert (een parking of een eigendom verlaten), moet voorrang verlenen.',
    },
    'prio-5': {
      question: 'Een prioritair voertuig met blauwe zwaailichten en sirene nadert achter je. Je:',
      choices: ['Rijdt gewoon verder', 'Maakt de weg vrij en stopt indien nodig', 'Versnelt om voor hem te blijven'],
      explanation: 'Je moet de doorgang vrijmaken voor prioritaire voertuigen met een dringende opdracht.',
    },
    'prio-6': {
      question: 'Wie heeft voorrang op een rotonde aangeduid met het bord D5 en een B1?',
      choices: ['De weggebruikers die de rotonde oprijden', 'De weggebruikers die al op de rotonde rijden', 'Wie van rechts komt'],
      explanation: 'De weggebruikers die op de rotonde rijden, hebben voorrang.',
    },
    'prio-7': {
      question: 'Een voetganger is al op een oversteekplaats voor voetgangers gestapt. Je:',
      choices: ['Laat hem oversteken', 'Rijdt door als hij nog ver van je rijstrook is', 'Claxonneert om hem te waarschuwen'],
      explanation: 'Een voetganger die al op de oversteekplaats is, heeft voorrang.',
    },

    // ——— Snelheid ———
    'vit-1': {
      question: 'Wat is in Wallonië de maximumsnelheid binnen de bebouwde kom, tenzij anders aangegeven?',
      choices: ['30 km/u', '50 km/u', '70 km/u'],
      explanation: 'Binnen de bebouwde kom is de maximumsnelheid 50 km/u (standaard 30 km/u in het Brussels Gewest).',
    },
    'vit-2': {
      question: 'Wat is de standaard maximumsnelheid binnen de bebouwde kom in het Brussels Hoofdstedelijk Gewest?',
      choices: ['30 km/u', '50 km/u', '20 km/u'],
      explanation: 'Sinds 2021 geldt in Brussel standaard 30 km/u, tenzij anders aangegeven.',
    },
    'vit-3': {
      question: 'Wat is de maximumsnelheid op de autosnelweg voor een auto (tenzij anders aangegeven)?',
      choices: ['110 km/u', '120 km/u', '130 km/u'],
      explanation: 'De maximumsnelheid op de autosnelweg is in België 120 km/u.',
    },
    'vit-4': {
      question: 'Op de autosnelweg is de toegelaten minimumsnelheid (tenzij anders aangegeven):',
      choices: ['50 km/u', '70 km/u', 'Er is geen minimumsnelheid'],
      explanation: 'De minimumsnelheid op de autosnelweg is 70 km/u.',
    },
    'vit-5': {
      question: 'Buiten de bebouwde kom in Vlaanderen, zonder verkeersborden, is de maximumsnelheid:',
      choices: ['70 km/u', '90 km/u', '100 km/u'],
      explanation: 'Sinds 2017 geldt in Vlaanderen buiten de bebouwde kom standaard 70 km/u (90 km/u in Wallonië).',
    },
    'vit-6': {
      question: 'In een woonerf (bord F12a) is de snelheid beperkt tot:',
      choices: ['20 km/u', '30 km/u', '10 km/u'],
      explanation: 'In een woonerf of erf is de maximumsnelheid 20 km/u.',
    },
    'vit-7': {
      question: 'In de buurt van een aangeduide school (schoolomgeving zone 30) rijd je maximaal:',
      choices: ['30 km/u', '50 km/u', '40 km/u'],
      explanation: 'Zones 30 in schoolomgevingen beperken de snelheid tot 30 km/u.',
    },
    'vit-8': {
      question: 'Wat is de maximale constructiesnelheid van een bromfiets klasse B?',
      choices: ['25 km/u', '45 km/u', '50 km/u'],
      explanation: 'Een bromfiets klasse B is door zijn constructie beperkt tot 45 km/u.',
    },

    // ——— Alcohol & drugs ———
    'alc-1': {
      question: 'Wat is het maximale alcoholgehalte voor een gewone bestuurder?',
      choices: ['0,2 g/l', '0,5 g/l', '0,8 g/l'],
      explanation: 'De limiet is 0,5 g/l bloed (0,22 mg/l uitgeademde lucht).',
    },
    'alc-2': {
      question: 'Voor een beroepschauffeur (vrachtwagen, bus) is het maximale alcoholgehalte:',
      choices: ['0,2 g/l', '0,5 g/l', '0,0 g/l'],
      explanation: 'Voor beroepschauffeurs geldt een limiet van 0,2 g/l.',
    },
    'alc-3': {
      question: 'Wat is de meest doeltreffende manier om je alcoholgehalte te laten dalen?',
      choices: ['Koffie drinken', 'Wachten', 'Een koude douche nemen'],
      explanation: 'Alleen tijd laat je lichaam de alcohol afbreken (ongeveer 0,1 tot 0,15 g/l per uur).',
    },
    'alc-4': {
      question: 'Je wordt erg slaperig op de autosnelweg. Je:',
      choices: ['Opent het raam en rijdt verder', 'Stopt op een parking om te rusten', 'Zet de radio luider'],
      explanation: 'De enige veilige oplossing tegen vermoeidheid is stoppen en rusten.',
    },

    // ——— Uitrusting ———
    'eq-1': {
      question: 'Welke uitrusting is verplicht aan boord van een auto in België?',
      choices: [
        'Fluovestje, gevarendriehoek, brandblusser en verbanddoos',
        'Alleen de gevarendriehoek',
        'Fluovestje en alcoholtester',
      ],
      explanation: 'Een veiligheidsvestje, gevarendriehoek, brandblusser en verbanddoos zijn verplicht.',
    },
    'eq-2': {
      question: 'Pech op een gewone weg: op welke afstand plaats je de gevarendriehoek?',
      choices: ['Op 10 m', 'Op 30 m', 'Op 100 m'],
      explanation: 'De gevarendriehoek plaats je op minstens 30 m (100 m op de autosnelweg), zichtbaar op 50 m.',
    },
    'eq-3': {
      question: 'Pech op de autosnelweg: op welke afstand plaats je de gevarendriehoek?',
      choices: ['30 m', '50 m', '100 m'],
      explanation: 'Op de autosnelweg plaats je de gevarendriehoek op minstens 100 m van het voertuig.',
    },
    'eq-4': {
      question: 'Een kind kleiner dan 1,35 m rijdt mee in je auto. Het moet:',
      choices: ['De gordel voor volwassenen dragen', 'In een aangepast kinderbeveiligingssysteem zitten', 'Vooraan zitten'],
      explanation: 'Kinderen kleiner dan 1,35 m moeten een zitje gebruiken dat aangepast is aan hun lengte en gewicht.',
    },
    'eq-5': {
      question: 'Wat is de minimale profieldiepte van de banden van een auto?',
      choices: ['1 mm', '1,6 mm', '3 mm'],
      explanation: 'De wettelijke minimale profieldiepte is 1,6 mm.',
    },
    'eq-6': {
      question: 'Welke uitrusting is verplicht op een motorfiets of bromfiets?',
      choices: [
        'Alleen een goedgekeurde helm',
        'Helm, handschoenen, jas met lange mouwen, lange broek en hoge schoenen',
        'Geen buiten de bebouwde kom',
      ],
      explanation: 'Helm, handschoenen, lange kleding en laarzen/schoenen die de enkels beschermen zijn verplicht.',
    },

    // ——— Stilstaan & parkeren ———
    'sta-1': {
      question: 'Parkeren is verboden op minder dan hoeveel meter vóór een oversteekplaats voor voetgangers?',
      choices: ['3 m', '5 m', '15 m'],
      explanation: 'Het is verboden te parkeren op minder dan 5 m vóór een oversteekplaats voor voetgangers.',
    },
    'sta-2': {
      question: 'Parkeren is verboden op minder dan … van een bushaltebord.',
      choices: ['5 m', '10 m', '15 m'],
      explanation: 'Parkeren is verboden op minder dan 15 m aan weerszijden van een bushalte.',
    },
    'sta-3': {
      question: 'Een blauwe zone verplicht:',
      choices: ['Betalend parkeren', 'Het leggen van een parkeerschijf', 'Stilstaan van maximaal 5 minuten'],
      explanation: 'In een blauwe zone moet je de parkeerschijf leggen, meestal voor 2 uur.',
    },
    'sta-4': {
      question: 'Mag je stilstaan op een fietspad?',
      choices: ['Ja, minder dan 5 minuten', 'Ja, met de noodknipperlichten aan', 'Nee, nooit'],
      explanation: 'Stilstaan en parkeren op een fietspad zijn verboden.',
    },

    // ——— Kwetsbare weggebruikers ———
    'vul-1': {
      question: 'Om een fietser in te halen buiten de bebouwde kom laat je een zijdelingse afstand van minstens:',
      choices: ['0,5 m', '1 m', '1,5 m'],
      explanation: 'De minimale zijdelingse afstand is 1 m binnen de bebouwde kom en 1,5 m buiten de bebouwde kom.',
    },
    'vul-2': {
      question: 'Binnen de bebouwde kom is de minimale zijdelingse afstand om een fietser in te halen:',
      choices: ['50 cm', '1 m', '2 m'],
      explanation: 'Binnen de bebouwde kom moet je minstens 1 m afstand laten.',
    },
    'vul-3': {
      question: 'Een stilstaande schoolbus met oranje knipperlichten: je',
      choices: ['Haalt in aan normale snelheid', 'Vertraagt sterk en bent extra voorzichtig', 'Claxonneert'],
      explanation: 'Er kunnen plots kinderen opduiken: vertraag en wees klaar om te stoppen.',
    },
    'vul-4': {
      question: 'In een fietsstraat (bord F111) mogen motorvoertuigen:',
      choices: [
        'Fietsers inhalen aan 50 km/u',
        'Fietsers niet inhalen en maximaal 30 km/u rijden',
        'Niet rijden (verboden)',
      ],
      explanation: 'In een fietsstraat is het verboden fietsers in te halen, maximumsnelheid 30 km/u.',
    },

    // ——— Inhalen ———
    'dep-1': {
      question: 'Langs welke kant haal je in de regel in?',
      choices: ['Langs rechts', 'Langs links', 'Maakt niet uit'],
      explanation: 'Inhalen gebeurt langs links, behalve uitzonderingen (voertuig dat links afslaat, tram…).',
    },
    'dep-2': {
      question: 'Een doorlopende witte streep in het midden van de rijbaan betekent:',
      choices: ['Inhalen toegelaten met voorzichtigheid', 'Verbod om de streep over te steken of erop te rijden', 'Parkeerverbod'],
      explanation: 'Een doorlopende streep mag je niet overschrijden en je mag er ook niet op rijden.',
    },
    'dep-3': {
      question: 'Welke rijstrook moet je op de autosnelweg gebruiken bij vlot verkeer?',
      choices: ['De linkerrijstrook', 'De rechterrijstrook', 'Om het even welke'],
      explanation: 'Je rijdt rechts; de andere rijstroken dienen om in te halen.',
    },
    'dep-4': {
      question: 'Bij file op de autosnelweg moet je:',
      choices: ['De pechstrook gebruiken', 'Een reddingsstrook vormen', 'Je grootlichten aansteken'],
      explanation: 'Een reddingsstrook tussen de linkerrijstrook en de andere rijstroken is verplicht bij file.',
    },
    'dep-5': {
      question: 'Hoe voeg je correct in bij een versmalling van rijstroken?',
      choices: ['Zo vroeg mogelijk', 'Door te ritsen (om beurten), op het punt van de versmalling', 'Door je een weg te forceren'],
      explanation: 'Ritsen is verplicht: je voegt om beurten in op het punt van de versmalling.',
    },

    // ——— Verkeerstekens & verlichting ———
    'sig-1': {
      question: 'Een vast oranje licht betekent:',
      choices: ['Versnellen om er nog door te rijden', 'Stoppen, tenzij je niet meer veilig kunt stoppen', 'Voorzichtig doorrijden'],
      explanation: 'Vast oranje verplicht je te stoppen, tenzij je er te dicht bij bent om nog veilig te stoppen.',
    },
    'sig-2': {
      question: 'Een bevoegd persoon geeft een teken dat ingaat tegen het verkeerslicht. Je volgt:',
      choices: ['Het verkeerslicht', 'De bevoegde persoon', 'Het verkeersbord'],
      explanation: 'De bevelen van bevoegde personen hebben voorrang op de verkeerstekens.',
    },
    'sig-3': {
      question: 'Wanneer moet je de dimlichten aansteken?',
      choices: ['Alleen ’s nachts', 'Van het vallen van de avond tot het aanbreken van de dag en bij zichtbaarheid onder 200 m', 'Alleen op de autosnelweg'],
      explanation: 'Dimlichten zijn verplicht ’s nachts en bij beperkte zichtbaarheid (< 200 m).',
    },
    'sig-4': {
      question: 'De mistachterlichten mag je gebruiken als de zichtbaarheid minder bedraagt dan:',
      choices: ['100 m', '200 m', '500 m'],
      explanation: 'Het mistachterlicht is voorbehouden voor een zichtbaarheid onder 100 m (mist, sneeuw, regen).',
    },
    'sig-5': {
      question: 'Een rond blauw bord geeft meestal aan:',
      choices: ['Een verbod', 'Een gebod', 'Een gevaar'],
      explanation: 'Ronde blauwe borden zijn gebodsborden (reeks D).',
    },

    // ——— Gedrag & ongeval ———
    'acc-1': {
      question: 'Welk nummer bel je in België bij een noodgeval?',
      choices: ['112', '911', 'Alleen 100'],
      explanation: '112 is het Europese noodnummer (100 en 101 bestaan ook).',
    },
    'acc-2': {
      question: 'Wat doe je eerst na een ongeval met gewonden?',
      choices: ['De gewonden verplaatsen', 'De plaats beveiligen en de hulpdiensten bellen', 'Het aanrijdingsformulier invullen'],
      explanation: 'Beschermen, alarmeren, helpen: beveilig de plaats, bel 112 en verleen dan hulp.',
    },
    'acc-3': {
      question: 'Een gsm in de hand houden tijdens het rijden is:',
      choices: ['Toegelaten als je stilstaat voor een rood licht', 'Verboden', 'Toegelaten binnen de bebouwde kom'],
      explanation: 'Een gsm in de hand houden tijdens het rijden is verboden, ook als je stilstaat in het verkeer.',
    },
    'acc-4': {
      question: 'De aanbevolen minimale veiligheidsafstand bij droog weer komt overeen met:',
      choices: ['1 seconde', '2 seconden', '5 seconden'],
      explanation: 'Men raadt de “2-secondenregel” aan; te verdubbelen bij regenweer.',
    },

    // ——— Motorfiets ———
    'moto-1': {
      question: 'Waar moet je blik naartoe gaan in een bocht op de motorfiets?',
      choices: ['Naar het voorwiel', 'Naar het uiteinde van de bocht', 'Naar de rand van de weg'],
      explanation: 'Ver vooruit kijken naar het uiteinde van de bocht zorgt voor een vloeiende rijlijn.',
    },
    'moto-2': {
      question: 'Het meest doeltreffende remmen op een droge weg met de motorfiets doe je:',
      choices: ['Alleen met de achterrem', 'Met beide remmen, vooral de voorrem', 'Met de motorrem'],
      explanation: 'De voorrem zorgt voor het grootste deel van de remkracht; gebruik beide remmen.',
    },
    'moto-3': {
      question: 'Mag een motorrijder tussen twee rijen stilstaande of traag rijdende voertuigen rijden?',
      choices: ['Nee, nooit', 'Ja, aan max. 50 km/u en met max. 20 km/u snelheidsverschil', 'Ja, zonder beperking'],
      explanation: 'Filerijden is toegelaten aan max. 50 km/u en met max. 20 km/u snelheidsverschil met de andere voertuigen.',
    },
    'am-1': {
      question: 'Mag een bromfiets klasse B op de autosnelweg rijden?',
      choices: ['Ja', 'Nee', 'Ja, op de rechterrijstrook'],
      explanation: 'Bromfietsen zijn verboden op de autosnelweg en op de autoweg.',
    },
    'am-2': {
      question: 'Een speed pedelec mag op het fietspad rijden:',
      choices: ['Nooit', 'Ja, binnen de bebouwde kom aan max. 30 km/u (behalve lokale regel)', 'Alleen ’s nachts'],
      explanation: 'Een speed pedelec mag het fietspad gebruiken, in principe aan 30 km/u binnen de bebouwde kom (45 km/u erbuiten).',
    },

    // ——— Vrachtwagens / bussen ———
    'pl-1': {
      question: 'Wat is de maximale dagelijkse rijtijd (algemene regel) voor een beroepschauffeur?',
      choices: ['8 uur', '9 uur (twee keer per week 10 u)', '12 uur'],
      explanation: 'Europese verordening: 9 u per dag, twee keer per week te verlengen tot 10 u.',
    },
    'pl-2': {
      question: 'Na 4 u 30 rijden is de minimale pauze:',
      choices: ['15 minuten', '45 minuten', '1 uur'],
      explanation: 'Een pauze van 45 minuten (op te splitsen in 15 + 30 min) is verplicht.',
    },
    'pl-3': {
      question: 'Voor je met een vrachtwagen rechts afslaat, moet je vooral controleren:',
      choices: ['De binnenspiegel', 'De dodehoekspiegels aan de rechterkant (fietsers, voetgangers)', 'De tachograaf'],
      explanation: 'De dode hoeken aan de rechterkant zijn de belangrijkste oorzaak van zware ongevallen met fietsers.',
    },
    'pl-4': {
      question: 'Wat is de maximumsnelheid van een vrachtwagen van meer dan 3,5 t op de autosnelweg?',
      choices: ['80 km/u', '90 km/u', '100 km/u'],
      explanation: 'Voertuigen van meer dan 3,5 t zijn beperkt tot 90 km/u op de autosnelweg.',
    },
    'pl-5': {
      question: 'Welk toestel registreert de rij- en rusttijden?',
      choices: ['De tachograaf', 'De gps', 'Het alcoholslot'],
      explanation: 'De tachograaf (digitaal of slim) registreert de rijtijden.',
    },
    'bus-1': {
      question: 'Binnen de bebouwde kom verlaat een bus een aangeduide halte en zet zijn richtingaanwijzer aan. De andere bestuurders:',
      choices: ['Moeten hem laten invoegen', 'Hebben voorrang', 'Moeten claxonneren'],
      explanation: 'Binnen de bebouwde kom moet je bussen de kans geven hun halte te verlaten.',
    },
    'bus-2': {
      question: 'Mag de buschauffeur vertrekken met open deuren?',
      choices: ['Ja, als de halte kort is', 'Nee', 'Ja, aan lage snelheid'],
      explanation: 'De deuren moeten gesloten zijn voor je vertrekt.',
    },

    // ——— Trekker ———
    'g-1': {
      question: 'Een landbouwtrekker die op de openbare weg rijdt, moet aansteken:',
      choices: ['Zijn dimlichten en indien vereist zijn oranje zwaailicht', 'Niets overdag', 'Zijn grootlichten'],
      explanation: 'Dimlichten overdag en ’s nachts, en een geeloranje knipperlicht afhankelijk van de afmetingen.',
    },
    'g-2': {
      question: 'Mag een landbouwtrekker de autosnelweg gebruiken?',
      choices: ['Ja', 'Nee', 'Ja, ’s nachts'],
      explanation: 'Landbouwvoertuigen zijn verboden op de autosnelweg.',
    },
    'g-3': {
      question: 'Je rijdt met je trekker terug van het veld, met de wielen vol modder. Je:',
      choices: ['Doet niets', 'Reinigt de bevuilde rijbaan of signaleert ze', 'Rijdt sneller zodat de modder loskomt'],
      explanation: 'Het is verboden de rijbaan te bevuilen; ze moet gereinigd worden of de zone moet gesignaleerd worden.',
    },
  },

  regions: {
    bruxelles: 'Brussel',
    wallonie: 'Wallonië',
    flandre: 'Vlaanderen',
  },

  errors: {
    'Région inconnue.': 'Onbekend gewest.',
    'Centre d’examen introuvable.': 'Examencentrum niet gevonden.',
    'Deux guides maximum.': 'Maximaal twee begeleiders.',
    'Le trajet ne peut pas être dans le futur.': 'De rit kan niet in de toekomst liggen.',
    'Durée invalide (5 à 720 minutes).': 'Ongeldige duur (5 tot 720 minuten).',
    'Distance invalide (0 à 1000 km).': 'Ongeldige afstand (0 tot 1000 km).',
    'Parcours inconnu.': 'Onbekende route.',
    'Carnet de bord complet.': 'Logboek is vol.',
    'Trajet introuvable.': 'Rit niet gevonden.',
    'Tu as atteint le nombre de questions au coach pour aujourd’hui. Reviens demain ou passe à un pack.': 'Je hebt het aantal vragen aan de coach voor vandaag bereikt. Kom morgen terug of neem een pakket.',
    'Écris ta question au coach.': 'Schrijf je vraag aan de coach.',
    'Question introuvable.': 'Vraag niet gevonden.',
    // app.js / api/index.js / errors.js / auth.js
    'Route inconnue.': 'Onbekende route.',
    'Service momentanément indisponible, réessaie dans quelques secondes.':
      'Dienst tijdelijk niet beschikbaar, probeer het over enkele seconden opnieuw.',
    'JSON invalide.': 'Ongeldige JSON.',
    'Erreur interne du serveur.': 'Interne serverfout.',
    'Authentification requise.': 'Aanmelding vereist.',
    'Accès réservé.': 'Toegang voorbehouden.',
    // validation.js
    'Position invalide.': 'Ongeldige locatie.',
    'Indiquez au moins une catégorie de permis enseignée.': 'Geef minstens één rijbewijscategorie op die je onderwijst.',
    'Langues invalides.': 'Ongeldige talen.',
    'Boîte de vitesses invalide.': 'Ongeldige versnellingsbak.',
    // routes/auth.js
    'Rôle invalide.': 'Ongeldige rol.',
    'Nom et prénom requis.': 'Naam en voornaam zijn verplicht.',
    'Adresse e-mail invalide.': 'Ongeldig e-mailadres.',
    'Le mot de passe doit contenir entre 8 et 200 caractères.': 'Het wachtwoord moet tussen 8 en 200 tekens bevatten.',
    'Un compte existe déjà avec cette adresse e-mail.': 'Er bestaat al een account met dit e-mailadres.',
    'Le numéro d’agrément (brevet de moniteur) est requis.':
      'Het erkenningsnummer (brevet van rijinstructeur) is verplicht.',
    'Trop de tentatives. Réessaie dans quelques minutes.': 'Te veel pogingen. Probeer het over enkele minuten opnieuw.',
    'E-mail ou mot de passe incorrect.': 'Onjuist e-mailadres of wachtwoord.',
    // routes/subscriptions.js
    'Aucun pack actif.': 'Geen actief pakket.',
    'Pack inconnu.': 'Onbekend pakket.',
    'Catégorie de permis invalide.': 'Ongeldige rijbewijscategorie.',
    'Tu as déjà un pack actif. Change de formule depuis ton pack.':
      'Je hebt al een actief pakket. Wijzig je formule vanuit je pakket.',
    'Date invalide (AAAA-MM-JJ).': 'Ongeldige datum (JJJJ-MM-DD).',
    'Rien à mettre à jour.': 'Niets om bij te werken.',
    // routes/theory.js
    'Connecte-toi pour passer un examen blanc.': 'Meld je aan om een proefexamen af te leggen.',
    'Catégorie théorique invalide.': 'Ongeldige theoriecategorie.',
    'Connecte-toi pour revoir tes erreurs.': 'Meld je aan om je fouten te herhalen.',
    'Aucune erreur à revoir : bravo ! 🎉': 'Geen fouten om te herhalen: proficiat! 🎉',
    'Aucune question pour cette sélection.': 'Geen vragen voor deze selectie.',
    'Quiz expiré ou invalide. Relance un nouveau quiz.': 'Quiz verlopen of ongeldig. Start een nieuwe quiz.',
    'Ce quiz a été délivré à un autre compte.': 'Deze quiz werd aan een ander account uitgereikt.',
    'Questions invalides.': 'Ongeldige vragen.',
    'Ce quiz a déjà été corrigé.': 'Deze quiz werd al verbeterd.',
    // routes/bookings.js
    'Leçon introuvable.': 'Les niet gevonden.',
    'Moniteur introuvable.': 'Rijinstructeur niet gevonden.',
    'Durée invalide (60, 90 ou 120 minutes).': 'Ongeldige duur (60, 90 of 120 minuten).',
    'Adresse de prise en charge requise.': 'Ophaaladres is verplicht.',
    'Ce moniteur n’est pas disponible maintenant.': 'Deze rijinstructeur is nu niet beschikbaar.',
    'Date de début invalide.': 'Ongeldige begindatum.',
    'La date de début est déjà passée.': 'De begindatum ligt al in het verleden.',
    'Le moniteur n’est pas disponible à cette heure. Choisis un créneau proposé.':
      'De rijinstructeur is op dit uur niet beschikbaar. Kies een voorgesteld tijdslot.',
    'Ce créneau n’est plus disponible.': 'Dit tijdslot is niet meer beschikbaar.',
    'Tu as déjà une leçon prévue sur ce créneau.': 'Je hebt al een les gepland in dit tijdslot.',
    'Action non autorisée pour votre rôle.': 'Actie niet toegestaan voor jouw rol.',
    'La leçon a changé entre-temps. Rafraîchis la page.': 'De les is intussen gewijzigd. Vernieuw de pagina.',
    'Vous pourrez noter la leçon une fois terminée.': 'Je kunt de les beoordelen zodra ze afgelopen is.',
    'Cette leçon a déjà été notée.': 'Deze les werd al beoordeeld.',
    'La note doit être comprise entre 1 et 5.': 'De score moet tussen 1 en 5 liggen.',
    'La fiche se remplit pendant ou après la leçon.': 'De evaluatiefiche wordt ingevuld tijdens of na de les.',
    'Niveaux invalides.': 'Ongeldige niveaus.',
    'Aucune compétence reconnue.': 'Geen herkende vaardigheid.',
    'Niveau entre 0 et 3.': 'Niveau tussen 0 en 3.',
    'Cette conversation est fermée.': 'Dit gesprek is gesloten.',
    'Message vide.': 'Leeg bericht.',
    'Trop de messages. Patiente un instant.': 'Te veel berichten. Wacht even.',
    'Le retour se donne après la leçon.': 'Feedback geef je na de les.',
    'Le retour ne peut pas être vide.': 'De feedback mag niet leeg zijn.',
    // routes/instructors.js
    'Disponibilités invalides.': 'Ongeldige beschikbaarheden.',
    'Chaque plage doit durer au moins 1 h, entre 00:00 et 24:00.':
      'Elke periode moet minstens 1 u duren, tussen 00:00 en 24:00.',
    'Un seul créneau par jour.': 'Slechts één tijdslot per dag.',
    'Indique au moins un jour de disponibilité.': 'Geef minstens één beschikbare dag op.',
    // routes/progress.js
    'Élève introuvable.': 'Leerling niet gevonden.',
  },

  errorPatterns: [
    [
      '^Tu as utilisé tes (\\d+) examens blancs gratuits de la semaine\\. Passe à un pack pour un accès illimité\\.$',
      'Je hebt je $1 gratis proefexamens van deze week gebruikt. Neem een pakket voor onbeperkte toegang.',
    ],
    [
      '^Le tarif horaire doit être compris entre ([\\d.,]+) € et ([\\d.,]+) €\\.$',
      'Het uurtarief moet tussen $1 € en $2 € liggen.',
    ],
    [
      '^Ce moniteur n’enseigne pas la catégorie (.+)\\.$',
      'Deze rijinstructeur geeft geen les voor categorie $1.',
    ],
    [
      '^Réservation possible jusqu’à (\\d+) jours à l’avance\\.$',
      'Reserveren kan tot $1 dagen op voorhand.',
    ],
    [
      '^Transition impossible : (\\S+) → (\\S+)\\.$',
      'Overgang onmogelijk: $1 → $2.',
    ],
  ],
};

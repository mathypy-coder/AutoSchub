// English translations (British English) of the AutoSchub source content (written in French).
// Consumed by `server/src/i18n.js`. Keys mirror the French data files; untranslated
// keys fall back to the French source text.
export default {
  skillLabels: {
    'Attelage d’outils et de remorque': 'Hitching implements and trailers',
    'Gabarit et signalisation du convoi agricole': 'Vehicle size and signalling of the agricultural convoy',
    'Marche arrière avec remorque': 'Reversing with a trailer',
  },
  // ——— Licence categories ———
  permitGroups: {
    'deux-roues': 'Two-wheelers',
    voiture: 'Car',
    'poids-lourd': 'Lorries',
    bus: 'Buses & coaches',
    agricole: 'Agricultural',
  },

  permits: {
    AM: {
      label: 'Moped',
      description: 'Mopeds (max 45 km/h), light quadricycles and speed pedelecs.',
    },
    A1: {
      label: 'Light motorcycle',
      description: 'Motorcycles up to 125 cc and 11 kW.',
    },
    A2: {
      label: 'Intermediate motorcycle',
      description: 'Motorcycles up to 35 kW.',
    },
    A: {
      label: 'Motorcycle',
      description: 'All motorcycles (direct access at 24, or after 2 years on A2).',
    },
    B: {
      label: 'Car',
      description: 'Vehicles up to 3.5 t and 8 passengers. Provisional licence possible from age 17.',
    },
    BE: {
      label: 'Car + trailer',
      description: 'Car towing a trailer of more than 750 kg.',
    },
    C1: {
      label: 'Light lorry',
      description: 'Lorries from 3.5 t to 7.5 t.',
    },
    C1E: {
      label: 'Light lorry + trailer',
      description: 'C1 with a trailer of more than 750 kg (total MAM ≤ 12 t).',
    },
    C: {
      label: 'Lorry',
      description: 'Lorries over 3.5 t (age 21, or 18 with a CPC).',
    },
    CE: {
      label: 'Articulated lorry',
      description: 'Lorry with a trailer of more than 750 kg.',
    },
    D1: {
      label: 'Minibus',
      description: 'Up to 16 passengers, max length 8 m.',
    },
    D1E: {
      label: 'Minibus + trailer',
      description: 'D1 with a trailer of more than 750 kg.',
    },
    D: {
      label: 'Bus / coach',
      description: 'More than 8 passengers (age 24, or 21 with a CPC).',
    },
    DE: {
      label: 'Bus + trailer',
      description: 'Bus with a trailer of more than 750 kg.',
    },
    G: {
      label: 'Agricultural tractor',
      description: 'Agricultural and forestry tractors, self-propelled agricultural machinery.',
    },
  },

  theoryCategories: {
    AM: 'Moped (AM)',
    A: 'Motorcycle (A1, A2, A)',
    B: 'Car (B, BE)',
    C: 'Lorries (C1, C, CE)',
    D: 'Bus (D1, D, DE)',
    G: 'Tractor (G)',
  },

  // ——— Subscription plans ———
  plans: {
    libre: {
      name: 'Supervised driving',
      tagline: 'Theory + supervisor: learn with someone close to you, we guide you',
      features: [
        'Everything in the Theory plan + unlimited AI coach',
        'Supervised-driving guide for your region (M36, waiting times, supervisor)',
        'Practice routes around your test centre',
        'Digital logbook (km, conditions, supervisors)',
        '-20% on check-up lessons with an instructor',
      ],
    },
    theorie: {
      name: 'Theory',
      tagline: 'To pass your theory test',
      features: [
        'Unlimited mock exams',
        'Track your journey all the way to your licence',
        'History and detailed corrections',
      ],
    },
    conduite: {
      name: 'Driving',
      tagline: 'Theory + practice, at your own pace',
      features: [
        'Everything in the Theory plan',
        '3 hours of driving included every month',
        '10% off extra hours',
        'Milestone reminders and driving-hour goals',
      ],
    },
    integral: {
      name: 'Complete',
      tagline: 'Full support all the way to your licence',
      features: [
        'Everything in the Driving plan',
        '6 hours of driving included every month',
        '15% off extra hours',
        'A dedicated driving instructor who follows your progress',
        'Dedicated preparation for the practical test',
      ],
    },
  },

  // ——— Skills sheet ———
  // Some ids are shared between lists (car / lorry / tractor); their labels are kept generic.
  skills: {
    installation: 'Seating position, adjustments and checks',
    observation: 'Observation, mirrors and blind spots',
    placement: 'Road positioning',
    vitesse: 'Appropriate speed and safe following distances',
    priorites: 'Priority rules and junctions',
    'ronds-points': 'Roundabouts',
    usagers: 'Pedestrians, cyclists and vulnerable road users',
    'changement-bande': 'Changing lanes and overtaking',
    signalisation: 'Obeying signs and signals',
    'demarrage-cote': 'Hill starts',
    creneau: 'Parallel parking',
    'marche-arriere': 'Reversing (in a straight line, around a corner or with a trailer)',
    'demi-tour': 'Turning round',
    autoroute: 'Motorway: joining, zip merging, emergency corridor',
    'eco-conduite': 'Smooth, economical driving',
    equipement: 'Protective gear',
    'maniabilite-lente': 'Slow-speed handling',
    slalom: 'Slalom and swerving',
    'freinage-urgence': 'Emergency braking',
    trajectoire: 'Cornering lines',
    verifications: 'Technical vehicle checks',
    gabarit: 'Vehicle size, blind spots and signalling',
    'mise-a-quai': 'Reversing and docking at a loading bay',
    attelage: 'Coupling and uncoupling (trailer and implements)',
    chargement: 'Safe loading / passengers',
  },

  skillGroups: {
    'Avant de partir': 'Before setting off',
    Circulation: 'On the road',
    Maniement: 'Vehicle control',
    'Manœuvres': 'Manoeuvres',
    Plateau: 'Off-road course',
  },

  skillLevels: {
    0: 'Not covered',
    1: 'Introduced',
    2: 'Improving',
    3: 'Mastered',
  },

  // ——— Theory questions ———
  themes: {
    'Priorités': 'Priority',
    Vitesse: 'Speed',
    'Alcool & drogues': 'Alcohol & drugs',
    'Équipement': 'Equipment',
    'Arrêt & stationnement': 'Stopping & parking',
    'Usagers vulnérables': 'Vulnerable road users',
    'Dépassement': 'Overtaking',
    Signalisation: 'Signs & signals',
    'Éclairage': 'Lights',
    Accident: 'Accidents',
    Comportement: 'Behaviour',
    Moto: 'Motorcycle',
    Cyclomoteur: 'Moped',
    'Temps de conduite': 'Driving time',
    'Angles morts': 'Blind spots',
    Documents: 'Documents',
    Passagers: 'Passengers',
    Tracteur: 'Tractor',
  },

  questions: {
    // ——— Priority ———
    'prio-1': {
      question: 'At a junction with no signs or signals, who has priority?',
      choices: ['The vehicle coming from the left', 'The vehicle coming from the right', 'The fastest vehicle'],
      explanation: 'When there are no signs or signals, priority to the right applies.',
    },
    'prio-2': {
      question: 'A triangular sign pointing downwards with a red border (B1). What must you do?',
      choices: ['Give way', 'Come to a mandatory stop', 'Nothing, I have priority'],
      explanation: 'The B1 sign means you must give way to road users on the road you are joining.',
    },
    'prio-3': {
      question: 'The STOP sign (B5) requires you to:',
      choices: [
        'Slow down and give way',
        'Come to a complete stop, then give way',
        'Stop only if a vehicle is coming',
      ],
      explanation: 'You must stop even if the road looks clear.',
    },
    'prio-4': {
      question: 'You are leaving a car park to join the road. You must:',
      choices: ['Give way to all road users', 'Apply priority to the right', 'Sound your horn and go'],
      explanation: 'Anyone carrying out a manoeuvre (leaving a car park or a property) must give way.',
    },
    'prio-5': {
      question: 'An emergency vehicle with blue lights and siren comes up behind you. You:',
      choices: ['Carry on as normal', 'Make way for it and stop if necessary', 'Speed up to stay ahead of it'],
      explanation: 'You must make way for priority vehicles on an emergency call.',
    },
    'prio-6': {
      question: 'At a roundabout marked with a D5 sign and a B1, who has priority?',
      choices: ['Road users entering', 'Road users already on the roundabout', 'Whoever comes from the right'],
      explanation: 'Road users already travelling on the roundabout have priority.',
    },
    'prio-7': {
      question: 'A pedestrian has stepped onto a pedestrian crossing. You:',
      choices: ['Let them cross', 'Go if they are still far from your lane', 'Sound your horn to warn them'],
      explanation: 'A pedestrian who is already on the crossing has priority.',
    },

    // ——— Speed ———
    'vit-1': {
      question: 'Unless signs say otherwise, what is the speed limit in built-up areas in Wallonia?',
      choices: ['30 km/h', '50 km/h', '70 km/h'],
      explanation: 'In built-up areas the speed limit is 50 km/h (30 km/h by default in the Brussels Region).',
    },
    'vit-2': {
      question: 'What is the default speed limit in built-up areas in the Brussels-Capital Region?',
      choices: ['30 km/h', '50 km/h', '20 km/h'],
      explanation: 'Since 2021, Brussels has applied a default limit of 30 km/h, unless signs say otherwise.',
    },
    'vit-3': {
      question: 'What is the speed limit on the motorway for a car (unless signs say otherwise)?',
      choices: ['110 km/h', '120 km/h', '130 km/h'],
      explanation: 'The motorway speed limit in Belgium is 120 km/h.',
    },
    'vit-4': {
      question: 'On the motorway, the minimum permitted speed (unless signs say otherwise) is:',
      choices: ['50 km/h', '70 km/h', 'There isn’t one'],
      explanation: 'The minimum speed on the motorway is 70 km/h.',
    },
    'vit-5': {
      question: 'Outside built-up areas in Flanders, with no signs, the speed limit is:',
      choices: ['70 km/h', '90 km/h', '100 km/h'],
      explanation: 'Since 2017, Flanders has had a default limit of 70 km/h outside built-up areas (90 km/h in Wallonia).',
    },
    'vit-6': {
      question: 'In a residential zone (sign F12a), the speed limit is:',
      choices: ['20 km/h', '30 km/h', '10 km/h'],
      explanation: 'In a residential or shared-space zone, the speed limit is 20 km/h.',
    },
    'vit-7': {
      question: 'Near a signposted school (school 30 zone), your maximum speed is:',
      choices: ['30 km/h', '50 km/h', '40 km/h'],
      explanation: '30 zones around schools limit speed to 30 km/h.',
    },
    'vit-8': {
      question: 'What is the maximum design speed of a class B moped?',
      choices: ['25 km/h', '45 km/h', '50 km/h'],
      explanation: 'A class B moped is limited by design to 45 km/h.',
    },

    // ——— Alcohol & driver condition ———
    'alc-1': {
      question: 'What is the maximum blood alcohol level for an ordinary driver?',
      choices: ['0.2 g/l', '0.5 g/l', '0.8 g/l'],
      explanation: 'The limit is 0.5 g/l of blood (0.22 mg/l of exhaled air).',
    },
    'alc-2': {
      question: 'For a professional driver (lorry, bus), the maximum blood alcohol level is:',
      choices: ['0.2 g/l', '0.5 g/l', '0.0 g/l'],
      explanation: 'Professional drivers are subject to a limit of 0.2 g/l.',
    },
    'alc-3': {
      question: 'What is the most effective way to lower your blood alcohol level?',
      choices: ['Drinking coffee', 'Waiting', 'Taking a cold shower'],
      explanation: 'Only time gets rid of alcohol (roughly 0.1 to 0.15 g/l per hour).',
    },
    'alc-4': {
      question: 'You feel very drowsy on the motorway. You:',
      choices: ['Open the window and carry on', 'Stop at a service area to rest', 'Turn the radio up'],
      explanation: 'The only safe answer to tiredness is to stop and rest.',
    },

    // ——— Equipment & safety ———
    'eq-1': {
      question: 'What equipment is compulsory in a car in Belgium?',
      choices: [
        'Hi-vis vest, warning triangle, fire extinguisher and first-aid kit',
        'Only the warning triangle',
        'Hi-vis vest and breathalyser',
      ],
      explanation: 'A safety vest, warning triangle, fire extinguisher and first-aid kit are compulsory.',
    },
    'eq-2': {
      question: 'Breakdown on an ordinary road: how far away do you place the warning triangle?',
      choices: ['10 m', '30 m', '100 m'],
      explanation: 'The triangle goes at least 30 m away (100 m on the motorway), visible from 50 m.',
    },
    'eq-3': {
      question: 'Breakdown on the motorway: how far away do you place the warning triangle?',
      choices: ['30 m', '50 m', '100 m'],
      explanation: 'On the motorway, the triangle goes at least 100 m from the vehicle.',
    },
    'eq-4': {
      question: 'A child shorter than 1.35 m is travelling in your car. They must:',
      choices: ['Wear the adult seat belt', 'Be seated in a suitable child restraint', 'Travel in the front'],
      explanation: 'Children under 1.35 m must use a seat suited to their height and weight.',
    },
    'eq-5': {
      question: 'What is the minimum tread depth for car tyres?',
      choices: ['1 mm', '1.6 mm', '3 mm'],
      explanation: 'The legal minimum tread depth is 1.6 mm.',
    },
    'eq-6': {
      question: 'On a motorcycle or moped, what gear is compulsory?',
      choices: [
        'An approved helmet only',
        'Helmet, gloves, long-sleeved jacket, long trousers and boots covering the ankles',
        'None outside built-up areas',
      ],
      explanation: 'A helmet, gloves, long clothing and boots/shoes protecting the ankles are compulsory.',
    },

    // ——— Parking ———
    'sta-1': {
      question: 'Parking is prohibited within how many metres before a pedestrian crossing?',
      choices: ['3 m', '5 m', '15 m'],
      explanation: 'You may not park within 5 m before a pedestrian crossing.',
    },
    'sta-2': {
      question: 'Parking is prohibited within … of a bus stop sign.',
      choices: ['5 m', '10 m', '15 m'],
      explanation: 'Parking is prohibited within 15 m on either side of a bus stop.',
    },
    'sta-3': {
      question: 'A blue zone requires:',
      choices: ['Paid parking', 'Displaying a parking disc', 'Stopping for no more than 5 minutes'],
      explanation: 'In a blue zone, you must display a parking disc, usually for 2 hours.',
    },
    'sta-4': {
      question: 'Are you allowed to stop on a cycle path?',
      choices: ['Yes, for under 5 minutes', 'Yes, with your hazard lights on', 'No, never'],
      explanation: 'Stopping and parking on a cycle path are prohibited.',
    },

    // ——— Vulnerable road users ———
    'vul-1': {
      question: 'When overtaking a cyclist outside a built-up area, you leave a side gap of at least:',
      choices: ['0.5 m', '1 m', '1.5 m'],
      explanation: 'The minimum side gap is 1 m in built-up areas and 1.5 m outside them.',
    },
    'vul-2': {
      question: 'In a built-up area, the minimum side gap when overtaking a cyclist is:',
      choices: ['50 cm', '1 m', '2 m'],
      explanation: 'In built-up areas, you must leave at least 1 m.',
    },
    'vul-3': {
      question: 'A school bus is stopped with its orange lights flashing. You:',
      choices: ['Overtake at normal speed', 'Slow right down and take extra care', 'Sound your horn'],
      explanation: 'Children may suddenly appear: slow down and be ready to stop.',
    },
    'vul-4': {
      question: 'In a cycle street (sign F111), motor vehicles:',
      choices: [
        'May overtake cyclists at 50 km/h',
        'May not overtake cyclists and drive at a maximum of 30 km/h',
        'Are prohibited',
      ],
      explanation: 'In a cycle street, overtaking cyclists is prohibited and the maximum speed is 30 km/h.',
    },

    // ——— Overtaking & traffic ———
    'dep-1': {
      question: 'As a general rule, on which side do you overtake?',
      choices: ['On the right', 'On the left', 'Either side'],
      explanation: 'You overtake on the left, with some exceptions (a vehicle turning left, a tram…).',
    },
    'dep-2': {
      question: 'A solid white line down the middle of the road means:',
      choices: ['Overtaking allowed with care', 'You must not cross or straddle it', 'No parking'],
      explanation: 'A solid line must not be crossed or straddled.',
    },
    'dep-3': {
      question: 'On the motorway, in free-flowing traffic, which lane should you use?',
      choices: ['The left-hand lane', 'The right-hand lane', 'Any lane'],
      explanation: 'You drive on the right; the other lanes are for overtaking.',
    },
    'dep-4': {
      question: 'In a traffic jam on the motorway, you must:',
      choices: ['Use the hard shoulder', 'Form an emergency corridor', 'Switch on your headlights'],
      explanation: 'An emergency corridor between the left-hand lane and the others is compulsory when traffic slows down.',
    },
    'dep-5': {
      question: 'When lanes merge, how do you join correctly?',
      choices: ['As early as possible', 'Zip merge (taking turns) at the point where the lanes narrow', 'By forcing your way in'],
      explanation: 'Zip merging is compulsory: you take turns joining at the point where the lanes narrow.',
    },

    // ——— Signs, signals & lights ———
    'sig-1': {
      question: 'A steady amber light means:',
      choices: ['Speed up to get through', 'Stop, unless you can no longer stop safely', 'Proceed with care'],
      explanation: 'A steady amber light means stop, unless you are too close to stop safely.',
    },
    'sig-2': {
      question: 'An authorised officer gives a signal that contradicts the traffic light. You follow:',
      choices: ['The traffic light', 'The officer', 'The sign'],
      explanation: 'Instructions from authorised officers take precedence over signs and signals.',
    },
    'sig-3': {
      question: 'When must you switch on your dipped headlights?',
      choices: ['Only at night', 'From dusk to dawn and when visibility is below 200 m', 'Only on the motorway'],
      explanation: 'Dipped headlights are compulsory at night and in poor visibility (< 200 m).',
    },
    'sig-4': {
      question: 'Rear fog lights may be used when visibility is below:',
      choices: ['100 m', '200 m', '500 m'],
      explanation: 'The rear fog light is only for visibility below 100 m (fog, snow, rain).',
    },
    'sig-5': {
      question: 'A round blue sign generally indicates:',
      choices: ['A prohibition', 'A mandatory instruction', 'A hazard'],
      explanation: 'Round blue signs are mandatory signs (D series).',
    },

    // ——— Behaviour & accidents ———
    'acc-1': {
      question: 'Which number do you call in an emergency in Belgium?',
      choices: ['112', '911', '100 only'],
      explanation: '112 is the European emergency number (100 and 101 also exist).',
    },
    'acc-2': {
      question: 'After an accident with injuries, what should you do first?',
      choices: ['Move the injured', 'Make the scene safe and call the emergency services', 'Fill in the accident report'],
      explanation: 'Protect, alert, assist: make the scene safe, call 112, then give first aid.',
    },
    'acc-3': {
      question: 'Using a hand-held mobile phone while driving is:',
      choices: ['Allowed when stopped at a red light', 'Prohibited', 'Allowed in built-up areas'],
      explanation: 'Holding a mobile phone while driving is prohibited, including when stopped in traffic.',
    },
    'acc-4': {
      question: 'The minimum recommended following distance in dry weather is:',
      choices: ['1 second', '2 seconds', '5 seconds'],
      explanation: 'The “2-second rule” is recommended; double it in the rain.',
    },

    // ——— Motorcycle ———
    'moto-1': {
      question: 'On a motorcycle, where should you look when going round a bend?',
      choices: ['At the front wheel', 'Towards the exit of the bend', 'At the edge of the road'],
      explanation: 'Looking far ahead towards the exit of the bend gives you a smooth line.',
    },
    'moto-2': {
      question: 'On a dry road, the most effective way to brake on a motorcycle is:',
      choices: ['With the rear brake only', 'With both brakes, mostly the front', 'With engine braking'],
      explanation: 'The front brake does most of the braking; use both.',
    },
    'moto-3': {
      question: 'Can a motorcyclist ride between two lines of stationary or slow-moving vehicles?',
      choices: ['No, never', 'Yes, at max 50 km/h and no more than 20 km/h faster than the traffic', 'Yes, without limits'],
      explanation: 'Filtering is tolerated at max 50 km/h and no more than 20 km/h faster than the other vehicles.',
    },
    'am-1': {
      question: 'Can a class B moped be ridden on the motorway?',
      choices: ['Yes', 'No', 'Yes, in the right-hand lane'],
      explanation: 'Mopeds are prohibited on motorways and expressways.',
    },
    'am-2': {
      question: 'A speed pedelec may use the cycle path:',
      choices: ['Never', 'Yes, in built-up areas at max 30 km/h (unless local rules differ)', 'Only at night'],
      explanation: 'A speed pedelec may use the cycle path, in principle at 30 km/h in built-up areas (45 km/h outside).',
    },

    // ——— Lorries / buses ———
    'pl-1': {
      question: 'What is the maximum daily driving time (general rule) for a professional driver?',
      choices: ['8 hours', '9 hours (10 hours twice a week)', '12 hours'],
      explanation: 'EU regulation: 9 hours a day, which can be extended to 10 hours twice a week.',
    },
    'pl-2': {
      question: 'After 4 hours 30 minutes of driving, the minimum break is:',
      choices: ['15 minutes', '45 minutes', '1 hour'],
      explanation: 'A 45-minute break (which can be split into 15 + 30 min) is compulsory.',
    },
    'pl-3': {
      question: 'Before turning right in a lorry, what must you check above all?',
      choices: ['The interior mirror', 'The right-hand blind-spot mirrors (cyclists, pedestrians)', 'The tachograph'],
      explanation: 'Right-hand blind spots are the main cause of serious accidents involving cyclists.',
    },
    'pl-4': {
      question: 'What is the speed limit on the motorway for a lorry over 3.5 t?',
      choices: ['80 km/h', '90 km/h', '100 km/h'],
      explanation: 'Vehicles over 3.5 t are limited to 90 km/h on the motorway.',
    },
    'pl-5': {
      question: 'Which device records driving and rest times?',
      choices: ['The tachograph', 'The GPS', 'The alcohol interlock'],
      explanation: 'The tachograph (digital or smart) records driving times.',
    },
    'bus-1': {
      question: 'In a built-up area, a bus is pulling away from a marked stop with its indicator on. Other drivers:',
      choices: ['Must let it pull out', 'Have priority', 'Must sound their horn'],
      explanation: 'In built-up areas, you must allow buses to pull away from their stops.',
    },
    'bus-2': {
      question: 'May a bus driver pull away with the doors open?',
      choices: ['Yes, if the stop is short', 'No', 'Yes, at low speed'],
      explanation: 'The doors must be closed before pulling away.',
    },

    // ——— Tractor ———
    'g-1': {
      question: 'An agricultural tractor on a public road must have on:',
      choices: ['Its dipped headlights and its orange beacon if required', 'Nothing during the day', 'Its main beam headlights'],
      explanation: 'Dipped headlights day and night, plus a flashing amber beacon depending on the vehicle’s size.',
    },
    'g-2': {
      question: 'May an agricultural tractor use the motorway?',
      choices: ['Yes', 'No', 'Yes, at night'],
      explanation: 'Agricultural vehicles are prohibited on motorways.',
    },
    'g-3': {
      question: 'You are bringing your tractor back from the fields with its wheels covered in mud. You:',
      choices: ['Do nothing', 'Clean the dirty road or put up warning signs', 'Drive faster to shake off the mud'],
      explanation: 'It is prohibited to leave mud on the road; it must be cleaned or the area signposted.',
    },
  },

  regions: {
    bruxelles: 'Brussels',
    wallonie: 'Wallonia',
    flandre: 'Flanders',
  },

  // ——— Error messages (keys = exact French source strings) ———
  errors: {
    'Région inconnue.': 'Unknown region.',
    'Centre d’examen introuvable.': 'Test centre not found.',
    'Deux guides maximum.': 'Two supervisors at most.',
    'Le trajet ne peut pas être dans le futur.': 'The drive cannot be in the future.',
    'Durée invalide (5 à 720 minutes).': 'Invalid duration (5 to 720 minutes).',
    'Distance invalide (0 à 1000 km).': 'Invalid distance (0 to 1000 km).',
    'Parcours inconnu.': 'Unknown route.',
    'Carnet de bord complet.': 'Logbook is full.',
    'Trajet introuvable.': 'Drive not found.',
    'Tu as atteint le nombre de questions au coach pour aujourd’hui. Reviens demain ou passe à un pack.': 'You’ve reached today’s number of questions for the coach. Come back tomorrow or get a plan.',
    'Écris ta question au coach.': 'Write your question to the coach.',
    'Question introuvable.': 'Question not found.',
    // app.js / errors.js / auth.js / api/index.js
    'Route inconnue.': 'Unknown route.',
    'JSON invalide.': 'Invalid JSON.',
    'Erreur interne du serveur.': 'Internal server error.',
    'Authentification requise.': 'Authentication required.',
    'Accès réservé.': 'Access restricted.',
    'Service momentanément indisponible, réessaie dans quelques secondes.':
      'Service temporarily unavailable, try again in a few seconds.',

    // validation.js
    'Position invalide.': 'Invalid location.',
    'Indiquez au moins une catégorie de permis enseignée.': 'Please give at least one licence category you teach.',
    'Langues invalides.': 'Invalid languages.',
    'Boîte de vitesses invalide.': 'Invalid gearbox.',

    // routes/auth.js
    'Rôle invalide.': 'Invalid role.',
    'Nom et prénom requis.': 'First name and surname are required.',
    'Adresse e-mail invalide.': 'Invalid email address.',
    'Le mot de passe doit contenir entre 8 et 200 caractères.': 'Your password must be between 8 and 200 characters long.',
    'Un compte existe déjà avec cette adresse e-mail.': 'An account already exists with this email address.',
    'Le numéro d’agrément (brevet de moniteur) est requis.':
      'Your approval number (driving instructor certificate) is required.',
    'Trop de tentatives. Réessaie dans quelques minutes.': 'Too many attempts. Try again in a few minutes.',
    'E-mail ou mot de passe incorrect.': 'Incorrect email or password.',

    // routes/subscriptions.js / routes/progress.js
    'Aucun pack actif.': 'No active plan.',
    'Pack inconnu.': 'Unknown plan.',
    'Catégorie de permis invalide.': 'Invalid licence category.',
    'Tu as déjà un pack actif. Change de formule depuis ton pack.':
      'You already have an active plan. Switch plans from your plan page.',
    'Date invalide (AAAA-MM-JJ).': 'Invalid date (YYYY-MM-DD).',
    'Rien à mettre à jour.': 'Nothing to update.',
    'Élève introuvable.': 'Learner not found.',

    // routes/theory.js
    'Connecte-toi pour passer un examen blanc.': 'Log in to take a mock exam.',
    'Catégorie théorique invalide.': 'Invalid theory category.',
    'Connecte-toi pour revoir tes erreurs.': 'Log in to review your mistakes.',
    'Aucune erreur à revoir : bravo ! 🎉': 'No mistakes to review: well done! 🎉',
    'Aucune question pour cette sélection.': 'No questions for this selection.',
    'Quiz expiré ou invalide. Relance un nouveau quiz.': 'Quiz expired or invalid. Start a new quiz.',
    'Ce quiz a été délivré à un autre compte.': 'This quiz was issued to another account.',
    'Questions invalides.': 'Invalid questions.',
    'Ce quiz a déjà été corrigé.': 'This quiz has already been marked.',

    // routes/bookings.js
    'Leçon introuvable.': 'Lesson not found.',
    'Moniteur introuvable.': 'Driving instructor not found.',
    'Durée invalide (60, 90 ou 120 minutes).': 'Invalid duration (60, 90 or 120 minutes).',
    'Adresse de prise en charge requise.': 'Pick-up address required.',
    'Ce moniteur n’est pas disponible maintenant.': 'This driving instructor isn’t available right now.',
    'Date de début invalide.': 'Invalid start date.',
    'La date de début est déjà passée.': 'The start date has already passed.',
    'Le moniteur n’est pas disponible à cette heure. Choisis un créneau proposé.':
      'The driving instructor isn’t available at that time. Pick one of the suggested slots.',
    'Ce créneau n’est plus disponible.': 'This slot is no longer available.',
    'Tu as déjà une leçon prévue sur ce créneau.': 'You already have a lesson booked in this slot.',
    'Action non autorisée pour votre rôle.': 'Action not allowed for your role.',
    'La leçon a changé entre-temps. Rafraîchis la page.': 'The lesson has changed in the meantime. Refresh the page.',
    'Vous pourrez noter la leçon une fois terminée.': 'You can rate the lesson once it’s finished.',
    'Cette leçon a déjà été notée.': 'This lesson has already been rated.',
    'La note doit être comprise entre 1 et 5.': 'The rating must be between 1 and 5.',
    'La fiche se remplit pendant ou après la leçon.': 'The skills sheet is filled in during or after the lesson.',
    'Niveaux invalides.': 'Invalid levels.',
    'Aucune compétence reconnue.': 'No recognised skills.',
    'Niveau entre 0 et 3.': 'Level must be between 0 and 3.',
    'Cette conversation est fermée.': 'This conversation is closed.',
    'Message vide.': 'Empty message.',
    'Trop de messages. Patiente un instant.': 'Too many messages. Wait a moment.',
    'Le retour se donne après la leçon.': 'Feedback is given after the lesson.',
    'Le retour ne peut pas être vide.': 'Feedback can’t be empty.',

    // routes/instructors.js
    'Disponibilités invalides.': 'Invalid availability.',
    'Chaque plage doit durer au moins 1 h, entre 00:00 et 24:00.':
      'Each time slot must last at least 1 hour, between 00:00 and 24:00.',
    'Un seul créneau par jour.': 'Only one time slot per day.',
    'Indique au moins un jour de disponibilité.': 'Give at least one day you are available.',
  },

  // ——— Messages built with template literals: [regex source, replacement] ———
  errorPatterns: [
    [
      '^Le tarif horaire doit être compris entre (\\d+(?:[.,]\\d+)?) € et (\\d+(?:[.,]\\d+)?) €\\.$',
      'The hourly rate must be between €$1 and €$2.',
    ],
    [
      '^Tu as utilisé tes (\\d+) examens blancs gratuits de la semaine\\. Passe à un pack pour un accès illimité\\.$',
      'You have used your $1 free mock exams this week. Get a plan for unlimited access.',
    ],
    [
      '^Ce moniteur n’enseigne pas la catégorie (.+)\\.$',
      'This driving instructor doesn’t teach category $1.',
    ],
    [
      '^Réservation possible jusqu’à (\\d+) jours à l’avance\\.$',
      'Lessons can be booked up to $1 days in advance.',
    ],
    [
      '^Transition impossible : (.+) → (.+)\\.$',
      'Status change not possible: $1 → $2.',
    ],
  ],
};

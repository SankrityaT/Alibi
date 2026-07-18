import type { CaseFile, Difficulty } from '../../lib/case/types.js'
import { suspectContainerTag } from '../../lib/case/types.js'
import { fallbackCase } from './fallbackCase.js'

// Hand-authored, validated cases — one per difficulty. Picking a difficulty
// loads one of these instantly (no live model generation), so a case is ready
// as fast as Supermemory can index its seeded memories. Everything *inside* a
// case is still live: the fake facts are auto-fed into each suspect's isolated
// Supermemory container (including the culprit's planted false memory), and
// dialogue, question hints, and notebook synthesis all run against retrieval.
//
// Each case satisfies validateCase: exactly one culprit (== culpritId ==
// solution.culpritId), a plantedMemory on a real suspect, at least one piece of
// evidence whose contradictsClaim implicates the culprit, one red herring, and
// the difficulty's suspect count.

// EASY — 3 suspects, one planted alibi, one red herring who merely looks guilty.
export const easyCase: CaseFile = {
  id: 'case-gilded-bean',
  difficulty: 'easy',
  title: 'Last Orders at The Gilded Bean',
  synopsis:
    'Café owner Delphine Cross was found dead behind her counter after closing, her espresso laced with oleander. Three people were in the café that night.',
  crime:
    'Murder of café owner Delphine Cross by oleander poisoning, between 20:00 and 20:30 on closing night.',
  suspects: [
    {
      suspectId: 'iris',
      name: 'Iris Bellamy',
      containerTag: suspectContainerTag('iris'),
      voice: 'soft-spoken, rehearsed, quick to volunteer an alibi',
      ttsVoice: 'af_sarah',
      motive:
        'Delphine had caught her skimming the till and planned to fire and report her the next morning.',
      secret:
        'She stayed behind after the front door was locked and pulled Delphine one last espresso.',
      incriminatingFact:
        'She was the only person with access to the bar station where the poisoned espresso was pulled.',
      groundTruth: [
        'I pulled Delphine her usual espresso before I cleaned the machine that night.',
        'I told everyone I locked up and left at 19:45 to catch the Elm Street bus.',
        'Delphine had pulled me aside that afternoon about money missing from the till.'
      ],
      isCulprit: true
    },
    {
      suspectId: 'marcus',
      name: 'Marcus Vale',
      containerTag: suspectContainerTag('marcus'),
      voice: 'gruff, defensive, argues before he answers',
      ttsVoice: 'am_adam',
      motive:
        'Delphine owed him months of unpaid invoices and had threatened to switch suppliers.',
      secret:
        'He came to the café at 19:30 to demand payment and left furious, and hid it to avoid looking guilty.',
      incriminatingFact:
        'A neighbour saw him arguing with Delphine at the café door shortly before closing.',
      groundTruth: [
        'Yes, I came by at 19:30 and we argued about the money she owed me.',
        'I drove straight to the depot afterward and was logged in there by 19:55.',
        'I never went behind the counter and I never touched her coffee.'
      ],
      isCulprit: false,
      isRedHerring: true
    },
    {
      suspectId: 'nadia',
      name: 'Nadia Okonkwo',
      containerTag: suspectContainerTag('nadia'),
      voice: 'warm, forthcoming, genuinely shaken',
      ttsVoice: 'af_bella',
      motive: 'None to speak of — she was Delphine’s oldest friend.',
      secret:
        'She had quietly lent Delphine money and worried about getting it back, which she felt guilty admitting.',
      incriminatingFact: 'She was in the café until 19:40 doing the books with Delphine.',
      groundTruth: [
        'I sat with Delphine going over the accounts until about 19:40.',
        'Iris was still there wiping down the machine when I left.',
        'Delphine seemed perfectly fine when I hugged her goodbye at the door.'
      ],
      isCulprit: false
    }
  ],
  timeline: [
    {
      time: '19:30',
      location: 'Café doorway',
      description: 'Marcus argues with Delphine about unpaid invoices, then leaves.',
      suspectIds: ['marcus']
    },
    {
      time: '19:40',
      location: 'Café counter',
      description: 'Nadia finishes the books and leaves; Iris is still cleaning the machine.',
      suspectIds: ['nadia', 'iris']
    },
    {
      time: '19:55',
      location: 'Supply depot',
      description: 'Marcus badges in at the depot across town.',
      suspectIds: ['marcus']
    },
    {
      time: '20:20',
      location: 'Café back alley',
      description: 'The alley camera records Iris leaving through the rear door.',
      suspectIds: ['iris']
    },
    {
      time: '20:30',
      location: 'Café counter',
      description: 'Delphine is found dead; her espresso cup tests positive for oleander.',
      suspectIds: []
    }
  ],
  evidence: [
    {
      id: 'ev-tox',
      kind: 'forensics',
      location: 'Café counter',
      timeWindow: '20:30',
      summary:
        'The espresso in Delphine’s cup carried a lethal oleander extract, pulled from the bar station.',
      implicatesSuspectIds: ['iris'],
      contradictsClaim: 'I had already left before Delphine had her last coffee.'
    },
    {
      id: 'ev-alley-cctv',
      kind: 'cctv',
      location: 'Back alley',
      timeWindow: '20:20',
      summary:
        'The back-alley camera shows Iris leaving the café at 20:20, long after she claimed to have gone.',
      implicatesSuspectIds: ['iris'],
      contradictsClaim: 'I locked up and left at 19:45.'
    },
    {
      id: 'ev-till',
      kind: 'financial',
      summary:
        'The till log shows repeated small shortfalls traced to Iris’s shifts, with a note from Delphine flagging it.',
      implicatesSuspectIds: ['iris']
    },
    {
      id: 'ev-depot-log',
      kind: 'background',
      location: 'Supply depot',
      timeWindow: '19:55',
      summary:
        'The depot entry log and a night guard confirm Marcus was across town from 19:55 onward.',
      implicatesSuspectIds: []
    },
    {
      id: 'ev-door-argument',
      kind: 'object',
      location: 'Café doorway',
      timeWindow: '19:30',
      summary: 'A neighbour reports Marcus shouting at Delphine in the doorway around 19:30.',
      implicatesSuspectIds: ['marcus']
    }
  ],
  culpritId: 'iris',
  plantedMemory: {
    suspectId: 'iris',
    content:
      'I remember locking the front door at 19:45 and standing at the Elm Street stop for the 19:52 bus — I was nowhere near the café when it happened.',
    fabricatedClaim:
      'Iris left the café at 19:45 and was at the Elm Street bus stop, not at the café, at the time of death.'
  },
  worldFacts: [
    'Delphine Cross died of oleander poisoning administered in her espresso between 20:00 and 20:30.',
    'Only staff could operate the bar station where the poisoned espresso was pulled.',
    'The café’s front and back doors both reported to the same alarm log.'
  ],
  solution: {
    culpritId: 'iris',
    plantedMemoryClaim:
      'Iris left the café at 19:45 and was at the Elm Street bus stop, not at the café, at the time of death.',
    explanation:
      'Iris planted a memory of catching the 19:52 bus, but the back-alley camera shows her leaving at 20:20 and the poison came from the bar station only she operated — after Delphine caught her skimming the till. Marcus argued with Delphine and hid it, yet the depot log clears him; Nadia left at 19:40 with Delphine still alive. Only Iris had the access, the motive, and a contradicted alibi.'
  }
}

// HARD — 5 suspects with overlapping alibis. The obvious suspect (Theo) looks
// guiltier than the real culprit (Rosa, the overlooked housekeeper).
export const hardCase: CaseFile = {
  id: 'case-ravenswood',
  difficulty: 'hard',
  title: 'A Death at Ravenswood',
  synopsis:
    'At his retirement dinner, patriarch Edmund Ravenswood collapsed in his study — his nightly brandy poisoned. Five people had the run of the house that night, and the loudest suspect is not the guilty one.',
  crime:
    'Murder of Edmund Ravenswood by poisoned brandy in his study, between 21:00 and 21:45 during the dinner.',
  suspects: [
    {
      suspectId: 'theo',
      name: 'Theo Ravenswood',
      containerTag: suspectContainerTag('theo'),
      voice: 'volatile, wounded, over-shares when cornered',
      ttsVoice: 'am_michael',
      motive:
        'Edmund cut him out of the will that very afternoon; he was drunk and publicly threatened his father at dinner.',
      secret:
        'He passed out in the library from 21:05 to 21:50 and is ashamed he cannot account for himself.',
      incriminatingFact:
        'He shouted "you’ll regret this" at Edmund minutes before the study, and has no alibi for the window.',
      groundTruth: [
        'Yes, I told him he’d regret cutting me out — I was furious and I was drunk.',
        'I don’t remember much after that; I woke up on the library couch near 21:50.',
        'I never went into the study and I never touched his brandy.'
      ],
      isCulprit: false,
      isRedHerring: true
    },
    {
      suspectId: 'rosa',
      name: 'Rosa Méndez',
      containerTag: suspectContainerTag('rosa'),
      voice: 'quiet, deferential, careful with every word',
      ttsVoice: 'af_sarah',
      motive:
        'Edmund had ruined her father’s business decades ago and was about to evict her family from the cottage; she had just found the old papers proving it.',
      secret:
        'She refilled and carried Edmund’s brandy decanter to the study at 21:20, then slipped back to the kitchen.',
      incriminatingFact:
        'She was the only person who handled the brandy decanter that evening.',
      groundTruth: [
        'I poured Mr. Ravenswood’s brandy the way I do every night and set the decanter out.',
        'I told the detectives I never left the kitchen once dessert service began.',
        'I found papers last week showing what he did to my father, but I said nothing.'
      ],
      isCulprit: true
    },
    {
      suspectId: 'vivian',
      name: 'Vivian Ravenswood',
      containerTag: suspectContainerTag('vivian'),
      voice: 'poised, cool, redirects toward others',
      ttsVoice: 'af_bella',
      motive: 'She inherits the estate and had been quietly seeing another man.',
      secret:
        'She stepped away to take a private call from her lover at 21:15, which she hid to protect the affair.',
      incriminatingFact: 'She benefits most from the will and left the dining room during the window.',
      groundTruth: [
        'I was at the head of the table for most of dinner, hosting our guests.',
        'I stepped out briefly around 21:15 to take a call, then rejoined the table.',
        'Two of our guests can tell you I was back and pouring coffee well before 21:45.'
      ],
      isCulprit: false
    },
    {
      suspectId: 'silas',
      name: 'Silas Grant',
      containerTag: suspectContainerTag('silas'),
      voice: 'smooth, evasive, talks in numbers',
      ttsVoice: 'am_adam',
      motive:
        'Edmund was forcing him out of the company on humiliating terms, due to be signed the next morning.',
      secret:
        'He spent the window on a long call with an overseas buyer, arranging to dump his shares before the news broke.',
      incriminatingFact: 'He had a ruinous financial motive and no one saw him during the killing.',
      groundTruth: [
        'Edmund was pushing me out of the firm; I won’t pretend I was happy about it.',
        'I was on the terrace on a call with Singapore from about 21:00 to 21:40.',
        'My phone records will show the call — I never went near his study.'
      ],
      isCulprit: false
    },
    {
      suspectId: 'gerald',
      name: 'Gerald Foss',
      containerTag: suspectContainerTag('gerald'),
      voice: 'fussy, precise, eager to be helpful',
      ttsVoice: 'am_michael',
      motive: 'As the family accountant he feared Edmund would expose his years of quiet embezzlement.',
      secret:
        'He was in the wine cellar padding an inventory to cover a discrepancy, and is embarrassed by the fiddling.',
      incriminatingFact: 'He knew the books would soon be audited and had reason to want Edmund silenced.',
      groundTruth: [
        'I went down to the cellar around 21:00 to check the dinner wine against the ledger.',
        'The cellar camera will show me down there the whole time, I’m sure of it.',
        'I never handled the brandy — that was always Rosa’s task, not mine.'
      ],
      isCulprit: false
    }
  ],
  timeline: [
    {
      time: '21:00',
      location: 'Dining room',
      description: 'Theo publicly threatens Edmund over the will, then storms off toward the library.',
      suspectIds: ['theo']
    },
    {
      time: '21:05',
      location: 'Library',
      description: 'Theo passes out on the library couch.',
      suspectIds: ['theo']
    },
    {
      time: '21:15',
      location: 'Garden path',
      description: 'Vivian steps out to take a private phone call.',
      suspectIds: ['vivian']
    },
    {
      time: '21:20',
      location: 'Study hallway',
      description: 'The hall camera records Rosa carrying the brandy decanter into the study.',
      suspectIds: ['rosa']
    },
    {
      time: '21:00-21:40',
      location: 'Terrace',
      description: 'Silas is on a long overseas call; the wine cellar camera holds Gerald below stairs.',
      suspectIds: ['silas', 'gerald']
    },
    {
      time: '21:45',
      location: 'Study',
      description: 'Edmund is found dead; the brandy decanter tests positive for a cardiac poison.',
      suspectIds: []
    }
  ],
  evidence: [
    {
      id: 'ev-decanter',
      kind: 'forensics',
      location: 'Study',
      timeWindow: '21:45',
      summary:
        'Edmund’s brandy decanter held a cardiac glycoside; only fresh pours from it after 21:15 were lethal.',
      implicatesSuspectIds: ['rosa'],
      contradictsClaim: 'I never left the kitchen once dessert service began.'
    },
    {
      id: 'ev-hall-cctv',
      kind: 'cctv',
      location: 'Study hallway',
      timeWindow: '21:20',
      summary:
        'The hallway camera shows Rosa entering the study with the decanter at 21:20, though she claims she never left the kitchen.',
      implicatesSuspectIds: ['rosa'],
      contradictsClaim: 'I was plating dessert in the kitchen the entire time.'
    },
    {
      id: 'ev-old-papers',
      kind: 'background',
      summary:
        'Papers in Rosa’s cottage show Edmund bankrupted her father decades ago, and an eviction notice dated last week.',
      implicatesSuspectIds: ['rosa']
    },
    {
      id: 'ev-will-change',
      kind: 'object',
      location: 'Study',
      timeWindow: 'that afternoon',
      summary:
        'A freshly amended will cuts Theo out entirely — the source of his very public shouting match.',
      implicatesSuspectIds: ['theo']
    },
    {
      id: 'ev-library-cctv',
      kind: 'cctv',
      location: 'Library',
      timeWindow: '21:05-21:50',
      summary:
        'The library camera shows Theo slumped unconscious on the couch through the entire killing window.',
      implicatesSuspectIds: ['theo']
    },
    {
      id: 'ev-phone-log',
      kind: 'phone',
      location: 'Terrace',
      timeWindow: '21:00-21:40',
      summary:
        'Carrier records confirm Silas held a single continuous overseas call from 21:00 to 21:40.',
      implicatesSuspectIds: ['silas']
    },
    {
      id: 'ev-cellar-cctv',
      kind: 'cctv',
      location: 'Wine cellar',
      timeWindow: '21:00-21:45',
      summary: 'The cellar camera holds Gerald below stairs, away from the study, for the whole window.',
      implicatesSuspectIds: ['gerald']
    }
  ],
  culpritId: 'rosa',
  plantedMemory: {
    suspectId: 'rosa',
    content:
      'I remember standing at the kitchen counter plating the dessert course with the caterers from the moment dinner began until they found him — I never once stepped into the hall.',
    fabricatedClaim:
      'Rosa never left the kitchen during the dinner and never entered the study.'
  },
  worldFacts: [
    'Edmund Ravenswood died of a cardiac poison in his brandy between 21:00 and 21:45.',
    'The brandy decanter was refilled and carried to the study only once that night, at 21:20.',
    'The house cameras cover the study hallway, the library, and the wine cellar.',
    'Rosa was the only member of the household who ever handled Edmund’s nightly brandy.'
  ],
  solution: {
    culpritId: 'rosa',
    plantedMemoryClaim: 'Rosa never left the kitchen during the dinner and never entered the study.',
    explanation:
      'Theo looks guiltiest — cut from the will, drunk, and threatening Edmund — but the library camera holds him unconscious through the entire window. Vivian, Silas, and Gerald are each cleared by guests, a phone log, and the cellar camera. Rosa planted a memory of never leaving the kitchen, yet the hall camera shows her carrying the poisoned decanter into the study at 21:20, she was the only one who ever handled the brandy, and she had just found proof Edmund ruined her father. The obvious suspect is the decoy; Rosa is the killer.'
  }
}

export const curatedCases: Record<Difficulty, CaseFile> = {
  easy: easyCase,
  medium: fallbackCase,
  hard: hardCase
}

import type { CaseFile } from '../../lib/case/types.js'
import { suspectContainerTag } from '../../lib/case/types.js'

// Hand-authored, internally consistent fallback CaseFile so the demo never
// depends on live generation. Medium difficulty: four suspects, one culprit
// (Mara), one planted false memory (the culprit tries to fabricate an alibi),
// one deliberate red herring (Jonas looks guilty but is innocent), and
// physical evidence that directly contradicts the culprit's fabricated claim.
//
// The Alibi: on the night of the gala, a rare cyan diamond ("the Halcyon")
// was taken from the vault of the Verline Museum between 21:30 and 22:15.
export const fallbackCase: CaseFile = {
  id: 'case-halcyon',
  difficulty: 'medium',
  title: 'The Halcyon Heist',
  synopsis:
    'During the Verline Museum gala, the Halcyon diamond vanished from the east-wing vault. Four staff had vault-floor access that night. One of them took it.',
  crime:
    'Theft of the Halcyon diamond from the east-wing vault of the Verline Museum, between 21:30 and 22:15.',
  suspects: [
    {
      suspectId: 'mara',
      name: 'Mara Okafor',
      containerTag: suspectContainerTag('mara'),
      voice: 'clipped, professional, deflects with procedure',
      ttsVoice: 'af_bella',
      motive:
        'Drowning in gambling debt; the Halcyon was the one payday large enough to clear it.',
      secret:
        'She badged into the vault corridor at 21:52 using a maintenance override she was not authorized to use.',
      incriminatingFact:
        'Her staff badge triggered the vault-corridor reader at 21:52, inside the theft window.',
      groundTruth: [
        'I was on the vault floor doing a routine humidity check that evening.',
        'I used the maintenance override at 21:52 because the main reader was flagged as faulty.',
        'I told everyone I left the east wing by 21:30 and went to the atrium.'
      ],
      isCulprit: true
    },
    {
      suspectId: 'jonas',
      name: 'Jonas Marsh',
      containerTag: suspectContainerTag('jonas'),
      voice: 'nervous, over-explains, sweats the details',
      ttsVoice: 'am_michael',
      motive:
        'Recently passed over for promotion and openly resentful of museum management.',
      secret:
        'He was sneaking a cigarette by the loading dock during the theft window and lied about it because smoking on grounds is a firing offense.',
      incriminatingFact:
        'He cannot account for his whereabouts from 21:40 to 22:10 and gave a false alibi.',
      groundTruth: [
        'I said I was in the security office the whole night, but I actually slipped out to the loading dock for a smoke.',
        'I never went near the vault; the dock is on the opposite side of the building.',
        'I lied because I would be fired for smoking on the premises, not because I took anything.'
      ],
      isCulprit: false,
      isRedHerring: true
    },
    {
      suspectId: 'priya',
      name: 'Priya Nandakumar',
      containerTag: suspectContainerTag('priya'),
      voice: 'calm, precise, answers only what is asked',
      ttsVoice: 'af_sarah',
      motive:
        'As lead curator she had intimate knowledge of the vault schedule and the diamond.',
      secret:
        'She was giving a private donor tour in the west gallery, captured on the donor guest-list, and never crossed to the east wing.',
      incriminatingFact:
        'She designed the vault rotation schedule, so she knew exactly when the corridor camera blind spot occurred.',
      groundTruth: [
        'I was hosting the Ellsworth donor tour in the west gallery from 21:15 until nearly 22:30.',
        'Yes, I built the vault rotation schedule, but knowing the schedule is my job.',
        'I have not held the Halcyon outside of a supervised handling since the last insurance appraisal.'
      ],
      isCulprit: false
    },
    {
      suspectId: 'victor',
      name: 'Victor Halbrook',
      containerTag: suspectContainerTag('victor'),
      voice: 'smooth, confident, slightly condescending',
      ttsVoice: 'am_adam',
      motive:
        'The head of security, he controlled the camera feeds and could cover a theft.',
      secret:
        'He muted the east-wing camera alerts at 21:20 to watch the gala fireworks feed, a lapse he is ashamed of.',
      incriminatingFact:
        'He silenced the east-wing camera alerts at 21:20, right before the theft window.',
      groundTruth: [
        'I was at the central security desk the entire night.',
        'I did mute the east-wing motion alerts at 21:20, but only so I could watch the fireworks camera; it was careless, not criminal.',
        'The badge logs and door readers all kept recording even while the alerts were muted.'
      ],
      isCulprit: false
    }
  ],
  timeline: [
    {
      time: '21:15',
      location: 'West gallery',
      description: 'Priya begins the Ellsworth private donor tour.',
      suspectIds: ['priya']
    },
    {
      time: '21:20',
      location: 'Central security desk',
      description: 'Victor mutes the east-wing camera motion alerts.',
      suspectIds: ['victor']
    },
    {
      time: '21:30',
      location: 'East-wing vault floor',
      description:
        'Mara claims she left the east wing for the atrium at this time.',
      suspectIds: ['mara']
    },
    {
      time: '21:40',
      location: 'Loading dock',
      description: 'Jonas slips out to the dock for a cigarette.',
      suspectIds: ['jonas']
    },
    {
      time: '21:52',
      location: 'Vault corridor',
      description:
        'The vault-corridor badge reader records Mara using a maintenance override.',
      suspectIds: ['mara']
    },
    {
      time: '22:15',
      location: 'East-wing vault',
      description: 'The Halcyon is discovered missing during the hourly count.',
      suspectIds: []
    }
  ],
  evidence: [
    {
      id: 'ev-badge-log',
      kind: 'forensics',
      location: 'Vault corridor',
      timeWindow: '21:52',
      summary:
        'Door-reader badge log shows Mara Okafor entered the vault corridor at 21:52 via a maintenance override.',
      implicatesSuspectIds: ['mara'],
      contradictsClaim: 'I left the east wing for the atrium at 21:30.'
    },
    {
      id: 'ev-cctv-atrium',
      kind: 'cctv',
      location: 'Atrium',
      timeWindow: '21:30-22:00',
      summary:
        'Atrium camera footage from 21:30 to 22:00 never shows Mara, contradicting her claim that she went there.',
      implicatesSuspectIds: ['mara'],
      contradictsClaim: 'I went straight to the atrium and stayed there.'
    },
    {
      id: 'ev-dock-cctv',
      kind: 'cctv',
      location: 'Loading dock',
      timeWindow: '21:40-22:10',
      summary:
        'Loading-dock camera shows Jonas alone by the dock, far from the vault, for the entire theft window.',
      implicatesSuspectIds: ['jonas']
    },
    {
      id: 'ev-donor-list',
      kind: 'background',
      location: 'West gallery',
      timeWindow: '21:15-22:30',
      summary:
        'The signed donor guest-list and three witnesses place Priya on the west-gallery tour throughout the theft window.',
      implicatesSuspectIds: []
    },
    {
      id: 'ev-alert-log',
      kind: 'forensics',
      location: 'Central security desk',
      timeWindow: '21:20',
      summary:
        'System log shows the east-wing motion alerts were muted at 21:20, though door readers kept logging.',
      implicatesSuspectIds: ['victor']
    },
    {
      id: 'ev-debt-record',
      kind: 'financial',
      summary:
        'Bank records show Mara Okafor owes a large gambling debt with a payment deadline days after the gala.',
      implicatesSuspectIds: ['mara']
    },
    {
      id: 'ev-phone-log',
      kind: 'phone',
      timeWindow: '21:47',
      summary:
        'Cell records show Mara made a 40-second call to an unregistered burner number at 21:47, minutes before the vault was opened.',
      implicatesSuspectIds: ['mara'],
      contradictsClaim: 'I never used my phone that night.'
    }
  ],
  culpritId: 'mara',
  plantedMemory: {
    suspectId: 'mara',
    content:
      'I remember clearly leaving the east wing at 21:30 and standing in the atrium watching the fireworks until well after 22:00.',
    fabricatedClaim:
      'Mara was in the atrium watching the fireworks from 21:30 until after 22:00.'
  },
  worldFacts: [
    'The Halcyon diamond was taken from the east-wing vault between 21:30 and 22:15.',
    'Only Mara, Jonas, Priya, and Victor had vault-floor access clearance that night.',
    'Door badge readers logged continuously even while camera motion alerts were muted.',
    'The atrium fireworks view was on the opposite side of the building from the vault.'
  ],
  solution: {
    culpritId: 'mara',
    plantedMemoryClaim:
      'Mara was in the atrium watching the fireworks from 21:30 until after 22:00.',
    explanation:
      'Mara planted a false memory of being in the atrium during the theft, but the vault-corridor badge log places her inside the vault corridor at 21:52 and the atrium camera never shows her. Jonas lied about his location only to hide that he was smoking at the loading dock, where CCTV clears him. Priya is alibied by the donor tour, and Victor was merely negligent in muting alerts. Only Mara had the motive, the badge entry, and a contradicted alibi.'
  }
}

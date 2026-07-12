//created by kinjal
// Static content arrays hoisted to module level (rendering-hoist-jsx) so they
// aren't re-created per render. Copy comes from LANDING_PAGE_BRIEF.md.

export type Feature = {
  tag: string
  title: string
  body: string
  icon: IconKey
  planned?: boolean
}

export type IconKey =
  | 'memory' | 'spread' | 'dig' | 'notebook'
  | 'culprit' | 'voice' | 'local'

export const FEATURES: Feature[] = [
  {
    tag: 'F-01',
    title: 'Suspects that remember',
    body: 'Persistent, private memory per character. Show them evidence and their next answer changes.',
    icon: 'memory',
  },
  {
    tag: 'F-02',
    title: 'Plant lies, watch them spread',
    body: 'Tell one suspect something false; see it resurface later — from a different suspect’s mouth.',
    icon: 'spread',
    planned: true,
  },
  {
    tag: 'F-03',
    title: 'Dig like a real detective',
    body: 'CCTV, phone records, forensics, financial traces, background checks, timeline reconstruction.',
    icon: 'dig',
    planned: true,
  },
  {
    tag: 'F-04',
    title: 'The Case Notebook',
    body: 'Plain-English questions synthesized across everything you learned, with citations to who said what.',
    icon: 'notebook',
    planned: true,
  },
  {
    tag: 'F-05',
    title: 'The killer cheats with memory',
    body: 'The crime itself is a memory tamper. Turn their own weapon against them to expose them.',
    icon: 'culprit',
    planned: true,
  },
  {
    tag: 'F-06',
    title: 'Voiced suspects, fully local',
    body: 'Each suspect speaks in their own voice (local TTS) — even the audio never leaves your machine.',
    icon: 'voice',
    planned: true,
  },
  {
    tag: 'F-07',
    title: '100% local & private',
    body: 'Your investigation, the suspects’ memories, even the voices — all on your machine.',
    icon: 'local',
  },
]

export type Step = { num: string; title: string; body: string; icon: IconKey }

export const STEPS: Step[] = [
  { num: '01', title: 'Walk the station', body: 'Move a real pixel-art detective through a 1940s police house — interrogation rooms, evidence locker, the case board.', icon: 'memory' },
  { num: '02', title: 'Interrogate', body: 'Four suspects lived through the same 48 hours. Press them. Show them evidence. Their memory — and their story — shifts.', icon: 'spread' },
  { num: '03', title: 'Dig evidence', body: 'CCTV, phone records, forensics, financial traces. Each fact enters your case memory.', icon: 'dig' },
  { num: '04', title: 'Connect in the Notebook', body: 'Ask a plain-English question. The Notebook synthesizes across everything you dug up, with citations.', icon: 'notebook' },
  { num: '05', title: 'Accuse', body: 'The picture collapses into one answer only after you’ve dug enough. Name the culprit — and the false memory they planted.', icon: 'culprit' },
]

export type Diff = { lvl: string; pts: string; body: string }
export const DIFFS: Diff[] = [
  { lvl: 'Easy', pts: '10', body: '~3 suspects, one planted memory, one clear contradiction. Solvable with a couple of moves.' },
  { lvl: 'Medium', pts: '20', body: '4 suspects, a planted memory plus a red herring. Contradictions need cross-referencing two or more sources.' },
  { lvl: 'Hard', pts: '30', body: '4–5 suspects, multiple or spreading planted memories, a decoy who looks guiltier than the real culprit. Only cracks via deep synthesis.' },
]
export const RANKS = ['Rookie', 'Detective', 'Inspector', 'Chief Inspector', 'Sherlock']

export type Faq = { q: string; a: string }
export const FAQS: Faq[] = [
  { q: 'What is Alibi?', a: 'A local-first noir detective game. You investigate a disappearance by interrogating four suspects who have real, persistent memory, and digging evidence from the world. One suspect’s memory was tampered with by the killer — your job is to catch them.' },
  { q: 'What makes it different from other detective games?', a: 'The suspects genuinely remember. Show them evidence or tell them a lie and it stays with them, changing their later answers. The mystery is literally a fight over memory — the killer rewrote someone’s, and you use memory (and their own tricks) to uncover the truth.' },
  { q: 'What is Supermemory?', a: 'Supermemory Local is a memory engine that runs entirely on your machine — storage, search, and embeddings, no cloud. It’s what gives each suspect real, private, searchable memory and lets your detective synthesize across an entire investigation.' },
  { q: 'Do I need an internet connection? Is my data sent anywhere?', a: 'The memory layer is fully local — suspect memories, evidence, and your investigation never leave your machine. (Claude, which generates the dialogue, runs through your Claude subscription.) A game about private memory that actually keeps memory private.' },
  { q: 'Do I need an API key?', a: 'No Anthropic API key. Claude runs through the Claude Agent SDK using your Claude subscription — just claude login once. You do need Supermemory Local running (it prints its own local key on first boot).' },
  { q: 'How do difficulty and points work?', a: 'Cases come in Easy (10 pts), Medium (20 pts), and Hard (30 pts). Harder cases have more planted or spreading false memories and need deeper digging. Solve all three for 60. Each case also gives a Detective Rating based on how you solved it — efficiency, whether you caught the planted memory, and whether a red herring fooled you.' },
  { q: 'Can I plant lies on the suspects?', a: 'Yes — and you should. Telling a suspect something false is a real tool: it can pressure them, spread through the group, or backfire when they realize you lied. It’s the same weapon the killer used.' },
  { q: 'What’s the "memory off" thing?', a: 'A toggle that turns the memory engine off, so you can see exactly what it does: with memory off, suspects forget everything instantly and the mystery falls apart. It’s the clearest proof that Supermemory is the game.' },
  { q: 'Is there a leaderboard?', a: 'Scoring is local today. A shared "Daily Case" leaderboard — one mystery everyone races to solve each day — is the next thing we’re building.' },
  { q: 'What do I need to run it?', a: 'Node.js 18+, the claude CLI (logged in), and Supermemory Local running on localhost:6767. Full steps in the README.' },
  { q: 'Who made it / what’s it built with?', a: 'Built for the Supermemory Local Hackathon with Supermemory Local, Claude (Agent SDK), Next.js, and Phaser. Pixel-art assets by Kenney & Ansimuz (CC0).' },
]

export type Run = {
  id: string
  caseName: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  points: number
  time: string
  rating: string
}

export const MOCK_BOARD: Run[] = [
  { id: 'm1', caseName: 'The Missing Courier', difficulty: 'Hard', points: 30, time: '14:22', rating: 'Sherlock' },
  { id: 'm2', caseName: 'The Missing Courier', difficulty: 'Hard', points: 30, time: '16:08', rating: 'Inspector' },
  { id: 'm3', caseName: 'The Missing Courier', difficulty: 'Medium', points: 20, time: '09:41', rating: 'Inspector' },
  { id: 'm4', caseName: 'The Missing Courier', difficulty: 'Easy', points: 10, time: '04:12', rating: 'Detective' },
]

export const LB_STORAGE_KEY = 'alibi-runs-v1'

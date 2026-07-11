# Alibi v2 — Expanded Design Scope (FINAL for review)

Date: 2026-07-11
Status: DRAFT — awaiting final review before any build
Hackathon deadline: 2026-07-13 23:59 PST (~2.5 days out)

Builds on the approved v1 spec (`2026-07-10-alibi-design.md`) and shipped code
(Plans 1-3: memory loop, walkable Phaser station + real character sprite,
interrogation UI + memory-trace panel, noir visual pass, Claude Agent SDK
subscription auth). v2 is about **grandness**: a real mystery-movie experience,
harder Supermemory leverage, and making the game's dependence on memory
*undeniable*.

The target feel: **Among Us × a Knives Out / noir slow-burn × Supermemory
Local.** Every suspect looks guilty of *something*; only one is guilty of *this*.
You keep everyone under suspicion, dig facts from the world, and the picture
collapses into one answer only after you've dug enough.

---

## 0. Foundational principle: it's an ENGINE, content is generated

**All game content is generated at runtime by our custom engine (Claude +
Supermemory) — not hand-scripted.** Suspects, the 48-hour timeline, who the
culprit is, the memory they planted, CCTV clips, phone logs, forensics, financial
traces, suspect dialogue — all produced by the engine. This makes Alibi a
reusable, replayable engine (strong "surprise us" hackathon signal), not a canned
mystery.

**The only hand-authored content is the UI**: labels, room names, button copy,
static chrome, and the visual design. (That's the part "I" generate.)

### Engine architecture (the hard, important part)

A generated mystery must be *solvable*: the culprit's planted lie must genuinely
contradict real evidence, the timeline must hold, and the dig must converge to
exactly one answer. So the engine is three stages, not "generate every turn":

1. **Case generation (once, at new-game).** Claude generates a *structured,
   validated* case object: suspects (name, motive, secret, real incriminating
   fact), the ground-truth 48h timeline, the culprit, the false memory the culprit
   planted (and in whom), and the full evidence set addressable by the
   investigation verbs (§3). A **validation pass** checks internal consistency and
   solvability (every contradiction resolves, exactly one culprit is provable).
2. **Seed.** The structured case is written into Supermemory: ground-truth
   memories per suspect (isolated by `containerTag`), the false memory into the
   culprit's container tagged `planted-by-culprit`, and world facts (CCTV, phone,
   forensics, financial) as retrievable evidence.
3. **Grounded runtime.** Every suspect answer and investigation result is
   generated live, grounded **only** in what Supermemory returns for that query.
   This is what makes memory load-bearing rather than decorative.

**Demo hedge:** keep one **hand-validated fallback case** so the demo recording
never depends on a generation coin-flip. Engine generates by default; fallback
guarantees a clean run.

---

## 1. The core reframe: the crime IS memory tampering

- **The culprit has already tampered with a suspect's memory before the game
  starts** — false facts seeded into a suspect's container (`planted-by-culprit`),
  never labeled as such to the player. The player must *discover* the tampering
  the way they'd catch their own planted lie: cross-examine, compare accounts,
  notice which "memory" contradicts physical evidence.
- **The player can plant lies too** — thematically the same act the culprit
  committed. Watch a lie spread, or get caught.
- **The ending** names the culprit *and* the false memory they installed to cover
  it, generated from the full memory trail.

---

## 2. Mystery & suspense design (the "keep-you-guessing" engine)

How the movie feeling is produced mechanically (every beat maps to a Supermemory
mechanic):

- **Everyone looks guilty at first** → each suspect's memory holds a genuine
  incriminating fact (real motive, a lie about their whereabouts, a secret). Any
  suspect you probe surfaces something damning early — served contextually by
  retrieval, not a fixed script.
- **Suspicion stays spread** → some "facts" are real memories, some are installed
  ones (culprit-planted or player-planted), and they are **indistinguishable from
  the outside**. That indistinguishability is the suspense engine — impossible
  without a store where false memories persist identically to true ones.
- **Digging makes it converge** → every fact you surface (testimony + every
  investigation verb) writes to *your* detective memory. The case board's
  contradictions are computed live from that growing pile; innocent suspects'
  stories become consistent with physical evidence, the culprit's stops adding up.
  The convergence is real search over accumulated memory, not a scripted "aha."
- **The decision** → you accuse; the ending reads back the specific path you took.

---

## 3. Investigation verbs (beyond typed questions)

The player directs a *case*, not just a chat. Typed dialogue is one verb; each
verb produces a fact that enters the detective's memory and can be presented to
suspects. Grounded in real procedurals:

- **Interrogate** (dialogue) — existing
- **Present evidence** to a suspect (Phoenix-Wright-style; their next line reacts)
- **Examine an object** — inspect a phone, receipt, weapon; surfaces details
- **Pull CCTV footage** for a location + time window — returns a clip/still
- **Phone records** — call logs, who-called-whom, cell-tower location pings
- **Financial trace** — transfers, who paid whom (motive)
- **Forensics / lab** — time of death, prints/DNA on an object
- **Background check** — priors, debts, relationships
- **Timeline reconstruction** — assemble known events, spot the gap
- **Ask the Notebook** — cross-everything synthesis query (§4)
- **Suggested move / hint** — when stuck, AI proposes the next question *or*
  investigative action fitting the current state (the "AI-generated questions"
  idea, generalized to actions)

The more verbs, the larger and more heterogeneous the memory store — which is
exactly what makes retrieval matter and the md-file argument (§6) collapse.

---

## 4. Harder Supermemory leverage

- **Detective's Case Notebook — live cross-suspect synthesis (NOW CORE).** Ask
  free-form ("what do I know about the docks?"); the engine searches the
  detective's accumulated memory across *every* interrogation and every
  investigation result so far, and Claude synthesizes an answer with citations
  back to which suspect/verb each fact came from. This is the load-bearing proof
  of "why Supermemory" (§6) — promoted from stretch to Core.
- **Lie-contagion / knowledge map (stretch).** Visualize which suspects "know" a
  given claim and in what order, built from real memory-search history — turns the
  best mechanic into the best screenshot.
- **Profile-driven suspect state.** `/v4/profile` derives each suspect's current
  trust/suspicion/what-they-hide from accumulated memories; show a visible diff
  after a suspect is caught in a lie.

---

## 5. Prove the dependency (the demo kill-shot)

- **A "Memory: ON/OFF" toggle.** Flip OFF → suspects stop remembering (the
  follow-up you asked two minutes ago draws a blank, a planted lie doesn't stick,
  the case board's contradictions vanish). Flip ON → same suspect, same question,
  it all snaps back. Implementation: swap the real `SupermemoryClient` for a null
  client returning no memories; nothing else changes. ~15-second beat that makes
  the dependency undeniable instead of narrated.

---

## 6. Why Supermemory, not an md file (the defense)

Anticipated judge challenge: *"I could keep an md file per character, append the
player's inputs, and dump it into the prompt. Why Supermemory?"*

Honest answer — an md file is fine for a toy with 15 static facts; it breaks the
moment the game becomes what makes it fun:

1. **Relevance at scale.** Dumping the whole store into every prompt as the
   session grows blows the context window, drowns the model in irrelevant facts
   (worse answers), and costs more every turn. Supermemory does hybrid
   semantic+keyword retrieval — ask about "the docks," get the 3 relevant
   memories, not all 200. With ~10 investigation verbs feeding it, the store is
   far too large/heterogeneous to dump.
2. **Cross-suspect synthesis (the Notebook).** Answering "what do I know about the
   docks?" must search across every suspect, every CCTV pull, every forensic
   result, every planted lie — the whole session — and synthesize with citations.
   Doing that with md files = rebuilding Supermemory, badly.
3. **Derived profiles.** Supermemory computes a suspect's current mental state
   from accumulated memories automatically; md files make you hand-maintain it
   every turn.
4. **Extraction.** Supermemory turns raw input (a messy statement, a transcript
   chunk) into structured retrievable memory; md files need hand-authored atomic
   facts.

**Winning line:** *"You can paste 15 facts into an md file. You cannot paste in
relevance-ranked retrieval across a growing multi-source investigation, automatic
profile derivation, and cross-entity synthesis — and those are the exact three
things that make the mystery playable. The game is built to require them."*

The **demo proves it, the argument frames it**: the memory-off toggle, the
Notebook synthesizing across a full case live, the profile-diff after a caught
lie, and the trace panel showing precise relevant memories retrieved from
hundreds — a judge *sees* Supermemory doing what an md dump visibly cannot at
scale. **This defense is only real if we use those capabilities** — which is why
the Notebook and the multi-verb investigation are Core, not stretch.

---

## 7. Conversational, characterful UI

- **Persistent interrogation transcript** — ongoing chat-style back-and-forth with
  portrait + name, not a box that replaces itself each question.
- **Distinct visual voice per suspect** — portrait, accent color, dialogue
  treatment.
- **Present-evidence as a conversational move** (§3).
- **Suggested question/lie/action affordance** (§3).

---

## 8. Audio — local (fits "everything on your machine")

- **TTS: Kokoro-82M (Core-if-time).** Apache-2.0, ~2-3GB, CPU faster-than-
  realtime, 54 voices. Small local service (`POST /tts {text, voice}` → wav);
  each suspect gets a distinct voice; suspect lines are spoken. Strong "even the
  voices never leave the laptop" story and the biggest single "feels like a real
  game" lift.
- **STT: stretch / likely drop.** Typing is cleaner for a recorded demo. If added:
  **whisper.cpp** (Metal, local) on the Mac demo machine — **Parakeet v3 is
  NVIDIA/CUDA-only and will not run on the Mac**, so it's the "deploy on an NVIDIA
  box" path only, not the demo path.

---

## 9. Assets — set the scene with Phaser

- More CC0 Kenney assets (Tiny Dungeon / Roguelike, already downloaded; add packs
  if needed): station walls, desks, doors, interrogation furniture, evidence-
  locker shelving, a case-board corkboard.
- Dress the station: real room interiors per room (interrogation / evidence locker
  / case board) instead of a bare floor, so it reads as a place.
- Suspect portraits from the same pixel-art sets, one per suspect, consistent
  style. All CC0, credited in `public/sprites/CREDITS.txt`.

---

## 10. Scope tiering (honest, ~2.5 days)

**v2 Core — must ship for the demo (build order):**
1. Persistent conversational transcript UI (§7).
2. Memory ON/OFF toggle (§5).
3. Engine: case generation + validation + seed, with the hand-validated fallback
   case (§0, §1).
4. Investigation verbs — at least Present + CCTV + phone + forensics beyond
   dialogue (§3), enough to make the store genuinely multi-source.
5. Detective's Case Notebook synthesis (§4) — the "why Supermemory" proof.
6. Scene dressing: room interiors + suspect portraits (§9).
7. Local TTS voices per suspect (§8) — Core if time allows after 1-6.

**Stretch — only if Core lands with time to spare:**
8. Lie-contagion map (§4).
9. STT voice input via whisper.cpp (§8).

**Cut lines:** drop STT first, then contagion map, then TTS, then trim
investigation verbs to Present + CCTV. Core 1-5 + fallback case is a complete,
winning demo on its own.

---

## 11. v2 demo video shape (~3 min)

1. Title → walk the dressed station into Interrogation Room 1.
2. Ask a suspect where they were at 22:10 — they answer **in their own voice**
   (Kokoro). Trace panel shows the real retrieved memory behind it.
3. Pull CCTV / phone records from the world; **Present** a contradicting clip to
   the liar — their next spoken line changes because it's now in their memory.
4. Plant a false lead in a second suspect; revisit the first; the lie has spread.
5. Open the **Notebook**: "what do I know about the docks?" — it synthesizes
   across every suspect and every clip pulled, with citations. (No md file does
   this.)
6. **Kill-shot:** flip Memory OFF — the suspect is blank, contradictions vanish;
   flip ON — it snaps back. "Without Supermemory, there's no game."
7. Accuse. The generated ending names the culprit *and* the planted false memory.

---

## 12. Non-goals for v2

- No second full case (cross-case memory stays a future idea).
- No cloud anything — TTS, STT, memory, LLM auth all local/subscription.
- No free-roam physics beyond room-to-room walking already built.
- No multiplayer, accounts, or save system beyond what Supermemory persists.

---

## Resolved decisions (from review discussion)

- Content is engine-generated; only UI content is hand-authored. ✅
- Investigation is multi-verb, not just typed Q&A. ✅
- Case Notebook cross-suspect synthesis → **Core** (it's the why-Supermemory
  defense). ✅
- TTS (Kokoro) → Core-if-time; STT → stretch/drop; Parakeet not on Mac demo
  path. ✅
- Generated case needs validation + a hand-validated fallback for demo safety. ✅

## Remaining question for the reviewer

- Any Core item you'd cut or reorder given the 2.5-day window? (My recommended
  minimum-winning set is Core 1-5 + fallback case; 6-7 are polish.)

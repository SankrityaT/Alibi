# Alibi v2 — Expanded Design Scope (for review)

Date: 2026-07-11
Status: DRAFT — awaiting review before any build
Hackathon deadline: 2026-07-13 23:59 PST (~2.5 days out)

This builds on the approved v1 spec (`2026-07-10-alibi-design.md`) and the code
already shipped (Plans 1-3: memory loop, walkable Phaser station, interrogation
UI + memory-trace panel, noir visual pass, Claude Agent SDK auth). v2 is about
**grandness**: making Alibi feel like a real game, leveraging Supermemory Local
harder, and making the game's dependence on memory *undeniable* rather than
asserted.

---

## 1. The core reframe: the crime IS memory tampering

v1 treated "plant a lie" as only a player tool. v2 makes memory manipulation the
spine of the whole mystery:

- **The culprit has already tampered with a suspect's memory before the game
  starts.** At case setup, false "facts" are seeded into one suspect's
  Supermemory container tagged `planted-by-culprit` — never shown to the player
  as such. The player must *discover* the tampering the same way they'd catch
  their own planted lie: by cross-examining, comparing accounts, and noticing
  which "memory" contradicts physical evidence.
- **The player can plant lies too** — and doing so is thematically the same act
  the culprit committed. Watch a lie spread suspect-to-suspect, or get caught.
- **The ending reveal** isn't just "who did it" — it's "who did it, and what
  false memory they installed to cover it."

Why this wins: it makes Supermemory the *engine of the mystery itself*, not a
storage layer under a normal whodunit. This directly serves pillar #3 (prove the
game couldn't exist without it).

---

## 2. Pillar 1 — Conversational, characterful UI

The single biggest thing making v1 feel like a form: each question wipes the last
answer. Fix that and add texture.

- **Persistent interrogation transcript.** An ongoing back-and-forth log (chat
  style with suspect portrait + name), not a single question-in/answer-out box
  that replaces itself. The whole conversation with a suspect stays on screen and
  scrolls.
- **Distinct visual voice per suspect.** Portrait, accent color, and dialogue
  treatment differ per suspect so switching rooms feels like meeting a different
  person. (Portraits: Phaser/pixel character art, see §6.)
- **"Present evidence" as a conversational move** (Phoenix-Wright-style): a
  Present button drops an evidence item into the transcript and the suspect's
  next line reacts to it live — instead of a separate silent form action.
- **Suggested-lie affordance** (from v1): an "AI-suggest a lie" button that
  proposes plausible false claims fitting the current case state; player picks or
  edits, then it's written as a planted memory.

---

## 3. Pillar 2 — Leverage Supermemory Local harder (the "bigger" idea)

Two additions, both real Supermemory work no chat app or Loom/Tana-style tool
does:

- **Detective's Case Notebook — live cross-suspect memory synthesis.** At any
  point the player asks the notebook a free-form question ("what do I actually
  know about the docks?"). This runs a real search over the *detective's own*
  accumulated memory across every interrogation and every piece of evidence shown
  so far, and Claude synthesizes an answer with citations back to which
  suspect/turn each fact came from. This is not a manually-maintained notes list
  — it's Supermemory doing synthesis across the entire session. Highest-impact
  "wow" for a memory-infra hackathon.
- **Lie-contagion / knowledge map.** Since a planted lie can spread between
  suspects, visualize the spread as a graph (who "knows" a given claim, in what
  order they came to know it), built from real memory-search history — not
  scripted. Turns the best mechanic into the best screenshot.

Both reuse the existing `/v4/search`, `/v3/documents`, and `/v4/profile`
plumbing plus one new detective-scoped container.

---

## 4. Pillar 3 — Prove the dependency (the demo kill-shot)

- **A "Memory: ON/OFF" toggle wired into the demo.** Flip it OFF and suspects
  instantly stop remembering: ask the follow-up you asked two minutes ago and
  they have no idea what you mean; a planted lie doesn't stick; contradictions
  vanish from the case board. Flip it back ON — same suspect, same question — and
  the whole thing snaps back together. Implementation is trivial: swap the real
  `SupermemoryClient` for a null client that returns no memories; nothing else
  changes. This is a ~15-second demo beat that makes "this needs Supermemory"
  undeniable instead of narrated.

---

## 5. Audio — local TTS (and optional STT)

Fits the hackathon's "everything stays on your machine" thesis perfectly: even
the voices never leave the laptop.

- **TTS: Kokoro-82M (local).** Apache-2.0, ~2-3GB, runs on CPU faster than
  real-time, 54 voices. Architecture: a small local service (Python FastAPI or
  `kokoro-onnx`) exposing `POST /tts {text, voice}` → wav; a Next.js route
  proxies it; each suspect is assigned a distinct Kokoro voice. When a suspect
  answers, synthesize and play the line. Short lines synthesize in a fraction of
  a second, so latency is a non-issue for a demo. **This is the feature that most
  makes suspects feel alive** and is a strong "even audio is local" story.
- **STT: optional / stretch.** The player types by default (better for a
  controlled demo anyway). If we add voice input:
  - On the **Mac dev/demo machine**, use **whisper.cpp** (Metal-accelerated,
    fully local, no GPU-vendor lock) — Parakeet v3 is **NVIDIA/CUDA-only** and
    will not run on the Mac, so it can't be the demo path.
  - Document **Parakeet-tdt-0.6b-v3** as the "if you deploy on an NVIDIA box"
    high-throughput option, but it is not on the demo critical path.
  - STT is explicitly a stretch item; cut first if time is short.

---

## 6. Assets — set the scene with Phaser

- Pull more from the existing CC0 Kenney packs already downloaded (Tiny Dungeon,
  Roguelike/RPG) plus one or two additional CC0 packs if needed: station walls,
  desks, doors, interrogation-room furniture, evidence-locker shelving, a case-
  board corkboard.
- Dress the station scene: real room interiors (walls/desks/doors) instead of a
  bare tiled floor, so walking between rooms reads as a place. Distinct look per
  room (interrogation, evidence locker, case board).
- Suspect portraits for the conversational UI (§2) sourced from the same
  pixel-art character sets, one per suspect, consistent style.
- All assets CC0, credited in `public/sprites/CREDITS.txt` (already established).

---

## 7. Scope tiering (honest, given ~2.5 days)

**v2 Core — must ship for the demo (in build order):**
1. Persistent conversational transcript UI (§2) — fixes biggest visible gap.
2. Memory ON/OFF toggle (§4) — biggest demo payoff per hour, trivial to build.
3. Culprit pre-planted memory + full Case 1 content (§1) — the mystery becomes
   real and solvable; one new `planted-by-culprit` source tag + authored case.
4. Local TTS voices per suspect (§5, Kokoro) — the "feels like a real game" +
   "even audio is local" beat.
5. Scene dressing: room interiors + suspect portraits (§6).

**Stretch — build only if Core lands with time to spare:**
6. Detective's Case Notebook cross-suspect synthesis (§3) — ambitious, highest
   ceiling; do it if Core is solid.
7. Lie-contagion map (§3).
8. STT voice input via whisper.cpp (§5).

**Cut lines if we fall behind:** drop STT first, then the contagion map, then the
notebook. Core alone is a complete, winning demo.

---

## 8. v2 demo video shape (~3 min)

1. Title card → walk the dressed station into Interrogation Room 1.
2. Ask a suspect where they were at 22:10 — they answer **in their own voice**
   (Kokoro). Memory-trace panel shows the real retrieved memory behind it.
3. Find evidence on another suspect's phone; **Present** it to the liar — their
   next spoken line changes because it's now in their memory.
4. Plant a false lead in a second suspect; revisit the first; show the lie has
   spread (contagion map if built, transcript if not).
5. **The kill-shot:** flip Memory OFF. Ask the same follow-up — the suspect is
   blank, the contradiction vanishes. Flip it ON — it all snaps back. Narrate:
   "Without Supermemory, there's no game."
6. Make the accusation; the ending, generated from the full memory trail, names
   the culprit *and* the false memory they planted.

---

## 9. Non-goals for v2

- No second full case (cross-case memory stays a stretch idea, not v2 Core).
- No cloud anything — TTS, STT, memory, and LLM auth are all local/subscription.
- No free-roam physics beyond room-to-room walking already built.
- No multiplayer, no accounts, no save system beyond what Supermemory persists.

---

## Open questions for the reviewer (you)

1. **TTS in or out of Core?** It's the biggest atmosphere win but adds a local
   Python/ONNX service to run alongside Next.js + Supermemory. In Core, or
   stretch?
2. **Case Notebook vs Contagion map** — if only one stretch item lands, which do
   you want prioritized? (I'd pick the Notebook — it's the stronger Supermemory
   showcase.)
3. **STT at all for this demo?** Typing is cleaner for a recorded demo; voice-in
   is cool but risky on time and Mac-constrained. Keep as stretch, or drop
   entirely?
4. **Case content** — happy for me to author Case 1's full script (4 suspects,
   timeline, ~15 evidence items, the culprit's planted memory), or do you want to
   shape the story beats first?

<h1 align="center">ALIBI</h1>

<p align="center"><em>A detective game where the suspects actually remember.</em></p>

<p align="center">
Interrogate four suspects, dig evidence out of the world, and catch the one who
<strong>rewrote someone's memory</strong> to get away with it.<br/>
A noir murder mystery powered by <strong>Supermemory Local</strong> — runs entirely on your machine.
</p>

<p align="center">
Built for the <strong>Supermemory Local Hackathon</strong> (localhost:6767) ·
Among Us × Knives Out × on-device memory.
</p>

---

## The hook — memory works two ways

Memory isn't a feature in Alibi; it's **two opposing forces on the same
Supermemory substrate**, and the game is the duel between them:

- **Memory as a WEAPON (manipulation).** Memory that can be rewritten. The killer
  plants a false memory to build an alibi and frame someone else. *You* can plant
  lies too — and watch them spread from one suspect to another. A planted memory
  is indistinguishable from a real one inside a suspect's head. That's the
  suspense.
- **Memory as a LENS (connection).** Memory that accumulates and connects. Every
  clue you dig up — testimony, CCTV, phone records, forensics — is remembered by
  your detective's case memory. Ask your Notebook *"what do I actually know about
  the docks?"* and it synthesizes across the whole investigation, with citations.

The killer weaponized memory against you. You use memory to connect your way back
to the truth — and you use their own trick to expose them. **Memory vs. memory.**

## Why Supermemory (and not just a text file)

A toy could hardcode a few facts per character. Alibi can't — and that's the
point. Suspects accumulate memory across a whole investigation; your detective
synthesizes across everything you've gathered; lies persist and spread; each
suspect's mental state (trust, suspicion, what they're hiding) updates as you
press them. That needs a real memory engine — **relevance-ranked retrieval,
cross-character synthesis, and mutable, isolated per-character memory.**
Supermemory Local is that engine, and it runs entirely on your machine — so even a
game about people's private memories keeps everything private.

The clearest proof is the **Memory ON/OFF toggle**: turn the engine off and the
suspects go blank — they forget what you told them, planted lies stop sticking,
contradictions vanish. *Without Supermemory, there's no game.*

## How you play

Walk the police station → interrogate suspects → dig facts from the world (CCTV,
phone records, forensics, financial traces, background checks) → connect it all in
your Case Notebook → make the accusation. Every suspect looks guilty of
*something*; only one is guilty of *this*. The picture collapses into one answer
only after you've dug enough.

## Running it

**Prerequisites**
- Node.js 18+ and npm
- The `claude` CLI, logged in — the game reaches Claude through the Claude Agent
  SDK using your Claude subscription, **no `ANTHROPIC_API_KEY` needed**.
- Supermemory Local running on your machine.

**1. Start Supermemory Local** (defaults to `http://localhost:6767`; prints an API
key on first boot):
```bash
npx supermemory local
```

**2. Configure env** — copy `.env.example` to `.env` and set the two Supermemory
values (no Claude key required):
```bash
cp .env.example .env
# SUPERMEMORY_BASE_URL=http://localhost:6767
# SUPERMEMORY_API_KEY=<key printed by supermemory on first boot>
```

**3. Install and run:**
```bash
npm install
claude login        # once, if you haven't already
npm run dev         # → http://localhost:3000
```

Pages: `/` (home), `/station` (walkable station), `/interrogation/mara`
(interrogation demo).

**Dev commands:** `npm test` · `npm run typecheck` · `npm run dev-interrogate`
(CLI harness exercising the memory loop against the live Supermemory server).

## Tech stack

- **Next.js 14** + React — app & UI
- **Phaser** — the walkable station
- **Supermemory Local** — the memory engine (storage, search, embeddings — all
  on-device)
- **Claude** via the **Claude Agent SDK** — dialogue & the case engine (auth via
  your Claude subscription)
- **Kokoro** (planned) — local text-to-speech suspect voices
- Pixel-art assets by **[Kenney](https://kenney.nl)** (CC0)

## Status

**Working today:** local memory loop (suspects answer grounded in their own
private, isolated memory and remember what you tell them), walkable Phaser station
with a real pixel-art detective, interrogation UI with a live memory-trace panel,
noir visual identity, Claude-via-subscription auth.

**In progress (v2):** persistent conversational transcript, Memory ON/OFF toggle,
generated cases with a planted-memory culprit, more investigation verbs
(CCTV/phone/forensics), the Case Notebook synthesis, difficulty tiers + Detective
Rating, local TTS voices, dressed room interiors + suspect portraits.

## Docs

- `docs/superpowers/specs/2026-07-11-alibi-v2-design.md` — the full v2 design
- `docs/LANDING_PAGE_BRIEF.md` — landing-page handoff brief
- `docs/superpowers/plans/` — implementation plans

## Privacy

The memory layer is fully local — suspect memories, evidence, and your entire
investigation never leave your machine. It's a game about private memory that
actually keeps memory private.

---

<p align="center">Built with Supermemory Local · Claude · Next.js · Phaser</p>

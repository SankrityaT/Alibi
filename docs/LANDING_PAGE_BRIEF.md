# Alibi — Landing Page Brief (for teammate)

Everything you need to build the marketing/landing site. This is a self-contained
handoff — you don't need to read the codebase. Deeper design detail lives in
`docs/superpowers/specs/2026-07-11-alibi-v2-design.md` if you want it, but this
brief covers the page.

---

## 0. One-liner (use this as the hero headline territory)

**Alibi — a detective game where the suspects actually remember.**
Interrogate four suspects, dig evidence from the world, and catch the one who
rewrote someone's memory to get away with it. Runs entirely on your machine.

Elevator version: *"A noir murder mystery powered by Supermemory Local. Every
suspect has real, private memory. Lie to them and they remember it. The killer
already planted a false memory to frame someone — your job is to out-remember
them. Among Us meets Knives Out, and it's 100% local."*

---

## 1. What Alibi is (the game)

A local-first, AI-driven noir detective game. A courier has vanished. Four
suspects lived through the same 48 hours. You are the investigator: you walk a
police station, interrogate suspects, and dig facts out of the world (CCTV, phone
records, forensics, financials) to figure out who did it.

The twist that makes it different from every other mystery game: **the suspects
have real, persistent, private memory** (powered by Supermemory Local). They
remember what you showed them, what you accused them of, and — critically — the
lies you told them. And the *killer* has already tampered with a suspect's memory
to build a fake alibi. The whole mystery is a fight over memory.

**The feel:** Among Us (everyone's a suspect, trust no one, then you accuse) × a
Knives Out / noir slow-burn (every suspect looks guilty of *something*; only one
is guilty of *this*) × the fact that it all runs on your laptop with nothing sent
to the cloud.

**The loop:** dig facts from the world → confront a suspect with them → watch
their memory (and their story) shift → connect everything → accuse. The picture
only collapses into one answer after you've dug enough.

---

## 2. THE HOOK — memory works two ways (this is the whole pitch)

This is the single most important idea to land on the page. Memory isn't a
feature here; it's **two opposing forces**, and the game is the duel between them:

- **Memory as a WEAPON (manipulation).** Memory that can be rewritten. The killer
  plants a false memory to frame someone. *You* can plant lies too — and watch
  them spread from one suspect to another. Because a planted memory is
  indistinguishable from a real one inside a suspect's head, you never quite know
  which "facts" are true. That's the suspense.
- **Memory as a LENS (connection).** Memory that accumulates and connects. Every
  clue you find gets remembered by your detective's case memory. Ask your Notebook
  "what do I actually know about the docks?" and it synthesizes across every
  suspect and every piece of evidence you've gathered — and points you at the
  contradiction that cracks the case.

Tagline candidates for this section:
- *"They weaponized memory. You'll use it to catch them."*
- *"Memory vs. memory."*
- *"The killer rewrote the truth. Out-remember them."*

---

## 3. Why Supermemory (and why not just a text file)

Judges/visitors will ask "why does this need Supermemory — couldn't you fake it?"
The honest, strong answer, in marketing language:

> A simple game could hardcode a few facts per character. Alibi can't — and that's
> the point. Suspects accumulate memory across a whole investigation; your detective
> synthesizes across everything you've dug up; lies persist and spread; each
> suspect's mental state (trust, suspicion, what they're hiding) updates as you
> press them. That needs a real memory engine — relevance-ranked retrieval,
> cross-character synthesis, and mutable, isolated per-character memory. Supermemory
> Local is that engine, and it runs entirely on your machine — so even a game about
> people's private memories keeps everything private.

The proof visitors can see (worth a section / GIF): **the Memory ON/OFF toggle.**
Flip memory off and the suspects go blank — they forget what you told them two
minutes ago, planted lies stop sticking, contradictions vanish. Flip it back on
and it all snaps together. *Without Supermemory, there's no game.*

Supermemory Local facts you can cite on the page:
- Runs the entire memory layer on your machine — one command, embeddings +
  storage + search all local. Nothing leaves the laptop.
- This project was built for the **Supermemory Local Hackathon** ("localhost:6767").

---

## 4. Feature highlights (suggested cards/sections for the page)

1. **Suspects that remember.** Persistent, private memory per character. Show them
   evidence and their next answer changes.
2. **Plant lies, watch them spread.** Tell one suspect something false; see it
   resurface later — from a *different* suspect's mouth.
3. **Dig like a real detective.** Not just Q&A — pull CCTV footage, phone records,
   forensics, financial traces, run background checks, reconstruct the timeline.
4. **The Case Notebook.** Ask a plain-English question and it synthesizes across
   everything you've learned, with citations back to who said what.
5. **The killer cheats with memory — so can you.** The crime itself is a memory
   tamper. Turn their own weapon against them.
6. **Voiced suspects, fully local.** Each suspect speaks in their own voice (local
   TTS) — even the audio never leaves your machine. *(Planned; see §9.)*
7. **100% local & private.** Your investigation, the suspects' memories, even the
   voices — all on your machine.

---

## 5. Brand & visual identity (MATCH THE GAME)

The game is 1940s film-noir police-procedural. The landing page should feel like
the same world — like a case file, not a generic SaaS page.

**Palette (CSS variables from the game):**
- Background near-black: `#0b0a08` (and `#16130f`, `#1c1712` for panels)
- "Paper" / cream text: `#e8dfc8`, dim `#a89b7d`, faint `#6f6552`
- Blood-red accent: `#9e1b1b` (bright `#d4392f`)
- Amber accent: `#d4952e`

**Type:**
- Display / headlines: **Bebas Neue** (tall condensed, stamped-poster feel)
- Body / UI / "case file" text: **IBM Plex Mono** (typewriter/dossier feel)

**Texture / mood:**
- Film-grain overlay + vignette (the game uses an animated SVG grain at ~5% opacity
  and a radial vignette). Subtle scanlines on "monitor" elements.
- Think: redacted case files, corkboard with red string, evidence tags, a flickering
  interrogation-room bulb. Red string connecting photos = perfect visual metaphor for
  "memory as a lens / connecting everything."

**Don't:** generic startup gradients, Inter/Roboto, purple-on-white, rounded pastel
cards. It should look like a noir mystery, not a dev tool.

---

## 6. Suggested page structure + draft copy

1. **Hero.** Big "ALIBI" (Bebas Neue, red glow), the one-liner from §0, a primary
   CTA ("Play the case" / "Watch the demo") and a secondary ("How it works").
   Background: dark, grainy, maybe a slow-zoom on a corkboard or a case file.
2. **The hook — memory works two ways** (§2). Two columns: WEAPON vs LENS.
3. **How you play** (the loop from §1): walk the station → interrogate → dig
   evidence → connect in the Notebook → accuse. A short animated/looping demo GIF
   per step is ideal.
4. **Feature cards** (§4).
5. **Why it's local / why Supermemory** (§3) — lead with privacy ("even a game
   about memory keeps yours private") and the Memory ON/OFF proof GIF.
6. **Difficulty & scoring** (§7) — Easy/Medium/Hard, points, Detective Rating.
7. **Demo video** (embed the ≤3-min hackathon demo once recorded).
8. **How to run it** (§8) — a short "get started" block, or link to the README.
9. **FAQ** (§10).
10. **Footer** — GitHub repo link, "Built for the Supermemory Local Hackathon,"
    credits (assets: Kenney CC0; built with Supermemory Local + Claude).

Hero copy options:
- *"Four suspects. One vanished courier. One of them rewrote the truth."*
- *"The suspects remember everything you say. So watch what you tell them."*
- *"A murder mystery where memory is the murder weapon."*

---

## 7. Difficulty & scoring (for the page AND the leaderboard page)

Cases are generated at three difficulty levels; harder cases have more planted /
spread false memories to see through and require more digging + synthesis to
solve.

| Level  | Points | What makes it hard |
|--------|:------:|--------------------|
| Easy   | **10** | ~3 suspects, one planted memory, one clear contradiction. |
| Medium | **20** | 4 suspects, a planted memory **plus** a red herring; needs cross-referencing. |
| Hard   | **30** | 4-5 suspects, multiple/spreading planted memories, a decoy who looks guiltier than the real culprit; only cracks via deep synthesis. |

Solve all three = **60 points.**

**Detective Rating** (shown at the end of each case): computed from *how* you
solved it — how few moves you used, whether you correctly identified the **planted
memory** (not just the culprit), and whether a red herring fooled you. Produces a
rank, e.g. *"Solved in 6 moves · caught the false memory · Rank: Inspector."*
Ranks can ladder like: Rookie → Detective → Inspector → Chief Inspector →
Sherlock.

---

## 8. How to run the app (real, current instructions)

The game is a Next.js app that talks to a local Supermemory server and uses Claude
via the Claude Agent SDK (your Claude subscription — no API key needed).

**Prerequisites**
- Node.js 18+ and npm
- The `claude` CLI, logged in (`claude login`) — this is how the game reaches
  Claude; it uses your Claude subscription, no `ANTHROPIC_API_KEY` required.
- Supermemory Local running on your machine (see below).

**1. Start Supermemory Local** (defaults to `http://localhost:6767`; prints an API
key + org id on first boot):
```bash
npx supermemory local
# or: curl -fsSL https://supermemory.ai/install | bash  &&  supermemory-server
```

**2. Configure env** — copy `.env.example` to `.env` and fill the two Supermemory
values (no Claude key needed):
```
SUPERMEMORY_BASE_URL=http://localhost:6767
SUPERMEMORY_API_KEY=<key printed by supermemory on first boot>
# No ANTHROPIC_API_KEY — Claude auth is handled by `claude login` (Agent SDK).
```

**3. Install + run the game:**
```bash
npm install
claude login        # once, if you haven't already
npm run dev         # http://localhost:3000
```

**Pages that exist today:** `/` (home), `/station` (walkable station),
`/interrogation/mara` (interrogation demo).
**Dev commands:** `npm test`, `npm run typecheck`, `npm run dev-interrogate`
(a CLI harness that exercises the memory loop against the live Supermemory server).

> Note for the landing page's "get started": link to the repo README rather than
> duplicating these steps, so they only need maintaining in one place.

---

## 9. What's real today vs. planned (be honest on the page)

Don't overclaim — but the vision is fair to show as "the game."

**Working today:** local memory loop (suspects answer grounded in their own private
memory, remember what you tell them, isolated per-suspect), walkable Phaser station
with a real pixel-art detective, interrogation UI with a live memory-trace panel,
noir visual identity, Claude-via-subscription auth.

**Planned for v2 (the pitch):** persistent conversational transcript, the Memory
ON/OFF toggle, the full generated case with a planted-memory culprit, the extra
investigation verbs (CCTV/phone/forensics), the Case Notebook synthesis, difficulty
tiers + Detective Rating, local TTS voices, dressed room interiors + suspect
portraits.

**Roadmap (not built):** Daily Case + global leaderboard (see §10), voice input
(STT).

If in doubt, present features in the present tense but keep the demo video as the
source of truth for what's actually shippable.

---

## 10. Leaderboards page

Honest status: for the hackathon, scoring is **local** (Detective Rating +
difficulty points, §7). A *global* leaderboard is a **post-launch roadmap feature**
because it's inherently networked, which cuts against the "everything stays on your
machine" promise. So design the leaderboard page one of two ways:

**Option A (recommended for now) — "Daily Case" concept + your local scores.**
- Explain the vision: a **Daily Case** — one shared generated mystery per day that
  *everyone* solves (like Wordle), so times and scores are actually comparable.
- Show the player's **own local run history / best ranks** (from local storage), and
  a "Global leaderboard — coming soon" panel describing how the Daily Case ranking
  will work.

**Option B — designed/mock leaderboard.** A full leaderboard table (rank, name,
case, difficulty, points, time, Detective Rating) populated with placeholder/mock
data, clearly framed as a preview of the Daily Case feature.

Columns to design for: **Rank · Detective · Case · Difficulty · Points · Time ·
Rating.** Point values are fixed by difficulty (10/20/30); ties broken by fewer
moves, then faster time. Mention the "solve all three difficulties = 60" milestone.

Either way, keep the framing: *scores are earned locally; the shared Daily Case
board is the social layer we're building next.*

---

## 11. FAQ (drafted — edit freely)

**What is Alibi?**
A local-first noir detective game. You investigate a disappearance by interrogating
four suspects who have real, persistent memory, and digging evidence from the world.
One suspect's memory was tampered with by the killer — your job is to catch them.

**What makes it different from other detective games?**
The suspects genuinely remember. Show them evidence or tell them a lie and it stays
with them, changing their later answers. The mystery is literally a fight over
memory — the killer rewrote someone's, and you use memory (and their own tricks) to
uncover the truth.

**What is Supermemory?**
Supermemory Local is a memory engine that runs entirely on your machine — storage,
search, and embeddings, no cloud. It's what gives each suspect real, private,
searchable memory and lets your detective synthesize across an entire investigation.

**Do I need an internet connection? Is my data sent anywhere?**
The memory layer is fully local — suspect memories, evidence, and your investigation
never leave your machine. (Claude, which generates the dialogue, runs through your
Claude subscription.) It's a game about private memory that actually keeps memory
private.

**Do I need an API key?**
No Anthropic API key. Claude runs through the Claude Agent SDK using your Claude
subscription — just `claude login` once. You do need Supermemory Local running (it
prints its own local key on first boot).

**How do difficulty and points work?**
Cases come in Easy (10 pts), Medium (20 pts), and Hard (30 pts). Harder cases have
more planted or spreading false memories and need deeper digging to solve. Solve all
three difficulties for 60. Each case also gives a Detective Rating based on *how*
you solved it — efficiency, whether you caught the planted memory, and whether a red
herring fooled you.

**Can I plant lies on the suspects?**
Yes — and you should. Telling a suspect something false is a real tool: it can
pressure them, spread through the group, or backfire when they realize you lied.
It's the same weapon the killer used.

**What's the "memory off" thing?**
A toggle that turns the memory engine off, so you can see exactly what it does: with
memory off, suspects forget everything instantly and the mystery falls apart. It's
the clearest proof that Supermemory *is* the game.

**Is there a leaderboard?**
Scoring is local today. A shared "Daily Case" leaderboard — one mystery everyone
races to solve each day — is the next thing we're building.

**What do I need to run it?**
Node.js, the `claude` CLI (logged in), and Supermemory Local running on
`localhost:6767`. Full steps in the README / §8 of this brief.

**Who made it / what's it built with?**
Built for the Supermemory Local Hackathon with Supermemory Local, Claude (Agent
SDK), Next.js, and Phaser. Pixel-art assets by Kenney (CC0).

---

## 12. Quick facts sheet (for footers, meta tags, cards)

- **Name:** Alibi
- **Genre:** Local-first AI noir detective / mystery
- **Built for:** Supermemory Local Hackathon (localhost:6767)
- **Stack:** Next.js 14 · React · Phaser (station) · Supermemory Local (memory) ·
  Claude via Claude Agent SDK (dialogue) · Kokoro TTS (local voices, planned)
- **Privacy:** memory engine 100% local; nothing about the investigation leaves the
  machine
- **Assets:** Kenney pixel-art packs (CC0)
- **Repo:** (add GitHub URL)
- **Demo video:** (add link once recorded)

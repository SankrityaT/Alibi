//created by kinjal
# Alibi landing page — asset slots to fill

The landing page is **complete and renders fully without any of these** —
inline SVG icons, CSS-drawn corkboard/red-string/pushpins, and styled
placeholders cover every slot. These are upgrades. All pixel art should be
**Kenney CC0** (Tiny Dungeon / Roguelike) to match `public/sprites/`.
Render pixel sprites with `image-rendering: pixelated` (the `.detective` img
already does).

## 1. Suspect portraits — `public/sprites/suspects/{name}.png`  *(highest impact)*
- `mara.png`, `elias.png`, `viv.png`, `decker.png` — 4 pixel-art noir portraits,
  ~128×128, transparent background.
- Swap into the hero corkboard `.photo-slot` divs in
  `components/landing/Hero.tsx` (replace the `SUSPECT 0N` placeholder text with
  `<img src="/sprites/suspects/mara.png" class="pixelated" .../>`), and into the
  `.mascot` corner of `components/landing/Features.tsx` (replace `<Icon/>`).

## 2. Demo video — `public/demo.mp4` (or a YouTube id)
- The ≤3-min hackathon demo. Un-comment the `<video>` block in
  `components/landing/DemoVideo.tsx` and set the poster + source. Until then the
  section shows a styled "Demo recording pending" placeholder inside a scanline
  screen panel.

## 3. Hero desk background — `public/sprites/hero-station.png` *(optional)*
- A pixel-art desk/corkboard or station image to sit behind the hero scene. Not
  currently referenced; if added, layer it as a low-opacity background on
  `.scene` in `app/landing.css`.

## 4. Inline icons *(optional)*
- `components/landing/icons.tsx` already provides noir/pixel inline SVGs
  (memory, spread, dig, notebook, culprit, voice, local) used by the How-you-play
  loop and the feature cards. To use true pixel sprites instead, replace the
  `<Icon name=.../>` call sites with `<img src="/sprites/icons/<name>.png"
  class="pixelated" alt=""/>`.

## 5. GitHub repo URL
- Set the real href in `components/landing/Footer.tsx` (currently
  `https://github.com/kinjal/alibi`).

## 6. Favicon / app icon — `app/icon.png` *(optional)*
- A small red-glow "A" on cream would match the wordmark.

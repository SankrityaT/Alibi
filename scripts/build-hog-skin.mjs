//created by kinjal
// Reskin @posthog/hedgehog-mode's atlas for Alibi.
// Reads the package's bundled sprites.png (2000x1440) + sprites.json, paints
// four cohesive Alibi pixel characters (detective + 3 suspects, each with idle
// + 2-frame walk) into the skins/<skin>/* frame rects, and writes the result
// to public/hedgehog/sprites.png. The baked-in atlas metadata is unchanged;
// only the pixel content at the reskinned rects is replaced (all other frames
// — accessories, overlays, ground, ghost — stay intact). MIT-licensed engine,
// none of PostHog's art or brand ships.
//
//   node scripts/build-hog-skin.mjs
import { PNG } from 'pngjs'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HO = resolve(__dirname, '..', 'node_modules', '@posthog', 'hedgehog-mode')
const ATLAS_PNG = resolve(HO, 'assets', 'sprites.png')
const ATLAS_JSON = resolve(HO, 'assets', 'sprites.json')
const OUT = resolve(__dirname, '..', 'public', 'hedgehog', 'sprites.png')

// --- color helpers ---
const hex = (h) => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const INK = '#2a2015'
const FACE = '#e8dfc8'

// --- 16x16 pixel canvas ---
const W = 16
const makeBuf = () => new Uint8ClampedArray(W * W * 4) // zero = transparent
const setPx = (buf, x, y, [r, g, b]) => {
  if (x < 0 || x >= W || y < 0 || y >= W) return
  const i = (y * W + x) * 4
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255
}
const rect = (buf, x, y, w, h, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) setPx(buf, x + i, y + j, c)
}
// wait — rect above closes over buf param incorrectly; redefine:
function fillRect(buf, x, y, w, h, c) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) setPx(buf, x + i, y + j, c)
}

// draw one figure in a given leg state
function drawFigure(o, legState) {
  const buf = makeBuf()
  const coat = hex(o.coat)
  const ink = hex(INK)
  const face = hex(FACE)
  const hair = o.hair ? hex(o.hair) : null
  // hat / hair
  if (o.hat === 'fedora') {
    fillRect(buf, 5, 0, 6, 2, ink); fillRect(buf, 3, 2, 10, 1, ink)
  } else if (o.hat === 'cap') {
    fillRect(buf, 4, 1, 7, 2, ink); fillRect(buf, 3, 3, 8, 1, ink)
  } else if (o.hat === 'bun' && hair) {
    fillRect(buf, 7, 0, 2, 2, hair)
    fillRect(buf, 4, 2, 1, 3, hair); fillRect(buf, 11, 2, 1, 3, hair); fillRect(buf, 5, 2, 6, 1, hair)
  } else if (o.hat === 'none' && hair) {
    fillRect(buf, 5, 1, 6, 1, hair); fillRect(buf, 4, 2, 1, 2, hair); fillRect(buf, 11, 2, 1, 2, hair); fillRect(buf, 5, 2, 6, 1, hair)
  }
  // face
  fillRect(buf, 5, 3, 6, 4, face)
  // eyes / glasses
  if (o.glasses) { fillRect(buf, 5, 5, 3, 1, ink); fillRect(buf, 8, 5, 3, 1, ink) }
  else { setPx(buf, 6, 5, ink); setPx(buf, 9, 5, ink) }
  // coat body + arms
  fillRect(buf, 4, 7, 8, 5, coat)
  fillRect(buf, 3, 8, 1, 4, coat); fillRect(buf, 12, 8, 1, 4, coat)
  // scarf / collar
  if (o.scarf) fillRect(buf, 6, 7, 4, 1, hex(o.scarf))
  // legs + shoes (leg state)
  let lx = 5, rx = 9
  if (legState === 'walkA') { lx = 6; rx = 9 }
  if (legState === 'walkB') { lx = 5; rx = 8 }
  fillRect(buf, lx, 12, 2, 3, ink); fillRect(buf, rx, 12, 2, 3, ink)
  fillRect(buf, lx, 15, 2, 1, ink); fillRect(buf, rx, 15, 2, 1, ink)
  return buf
}

// --- the 4 Alibi characters, mapped onto the 4 grounded enum skins ---
const SKINS = {
  default: { name: 'Detective', opts: { coat: '#57493a', hat: 'fedora', scarf: '#b3271b' } },
  spiderhog: { name: 'Mara', opts: { coat: '#b3271b', hat: 'none', hair: '#c98a2e' } },
  robohog: { name: 'Elias', opts: { coat: '#2a2015', hat: 'fedora', glasses: true } },
  hogzilla: { name: 'Viv', opts: { coat: '#8c7d64', hat: 'bun', hair: '#2a2015' } },
}

// pick a frame variant for an animation group
function variantFor(group, frameIndex) {
  if (group === 'walk') return frameIndex % 2 === 0 ? 'walkA' : 'walkB'
  if (group === 'jump' || group === 'fall') return 'walkB'
  return 'idle'
}

// nearest-neighbor stamp of a 16x16 source into the atlas at (x,y) sized (w,h)
function stamp(src16, atlas, ax, ay, aw, ah) {
  const sx = 16 / aw, sy = 16 / ah
  for (let y = 0; y < ah; y++) {
    for (let x = 0; x < aw; x++) {
      const sxi = Math.min(15, Math.floor(x * sx))
      const syi = Math.min(15, Math.floor(y * sy))
      const si = (syi * 16 + sxi) * 4
      const di = ((ay + y) * atlas.width + (ax + x)) * 4
      atlas.data[di] = src16[si]
      atlas.data[di + 1] = src16[si + 1]
      atlas.data[di + 2] = src16[si + 2]
      atlas.data[di + 3] = src16[si + 3]
    }
  }
}

// --- run ---
const atlas = PNG.sync.read(readFileSync(ATLAS_PNG))
const meta = JSON.parse(readFileSync(ATLAS_JSON, 'utf8'))
const frames = meta.frames
const animations = meta.animations

let stamped = 0
for (const [skin, { name, opts }] of Object.entries(SKINS)) {
  // pre-build the 3 variants once per skin
  const variants = {
    idle: drawFigure(opts, 'idle'),
    walkA: drawFigure(opts, 'walkA'),
    walkB: drawFigure(opts, 'walkB'),
  }
  for (const animKey of Object.keys(animations)) {
    // animKey e.g. "skins/default/walk"
    const parts = animKey.split('/')
    if (parts[0] !== 'skins' || parts[1] !== skin) continue
    const group = parts[2]
    const list = animations[animKey]
    list.forEach((frameName, i) => {
      const f = frames[frameName]
      if (!f) return
      const { x, y, w, h } = f.frame
      const v = variantFor(group, i)
      stamp(variants[v], atlas, x, y, w, h)
      stamped++
    })
  }
  console.log(`reskinned ${skin} -> ${name}`)
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, PNG.sync.write(atlas))
console.log(`\nstamped ${stamped} frames -> ${OUT}`)

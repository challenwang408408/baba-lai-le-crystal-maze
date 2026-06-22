import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  }
}

const items = read('src/components/Items.tsx')
const hud = read('src/components/HUD.tsx')
const store = read('src/game/store.ts')

assert(
  !items.includes('<pointLight'),
  'pickup items must not mount/unmount real Three.js lights during collection',
)
assert(
  items.includes('visible={!collected}') ||
    items.includes('scale={collected') ||
    items.includes('group.visible = false'),
  'pickup items should remain in the R3F tree when collected instead of returning null immediately',
)

const bgmPath = join(root, 'public/assets/bgm-calm-loop.wav')
assert(existsSync(bgmPath), 'background music asset public/assets/bgm-calm-loop.wav must exist')
if (existsSync(bgmPath)) {
  const size = statSync(bgmPath).size
  assert(size > 500_000, 'background music asset should contain real audio data, not a tiny placeholder')
  assert(size < 3_500_000, 'background music asset should stay small enough for the personal website')
}

const audio = existsSync(join(root, 'src/game/audio.ts')) ? read('src/game/audio.ts') : ''
assert(audio.includes("asset('assets/bgm-calm-loop.wav')"), 'audio module must resolve BGM through asset()')
assert(audio.includes('new Audio'), 'audio module should use a single HTMLAudioElement')
assert(
  audio.includes('.catch(') || (audio.includes('await audio.play()') && audio.includes('catch')),
  'audio.play() must catch autoplay/load failures',
)

assert(store.includes('musicEnabled'), 'game store must track musicEnabled')
assert(store.includes('toggleMusic'), 'game store must expose toggleMusic')
assert(hud.includes('Volume2') && hud.includes('VolumeX'), 'HUD must expose music on/off icons')
assert(hud.includes('toggleMusic'), 'HUD music button must call toggleMusic')

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('Maze optimization guards passed')

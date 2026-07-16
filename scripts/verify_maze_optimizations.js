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
const app = read('src/App.tsx')
const main = read('src/main.tsx')
const texture = read('src/utils/texture.ts')
const marble = read('src/components/Marble.tsx')
const board = read('src/components/MazeBoard.tsx')
const dad = read('src/components/Dad.tsx')

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

const bgmPath = join(root, 'public/assets/bgm-calm-loop.mp3')
assert(existsSync(bgmPath), 'background music asset public/assets/bgm-calm-loop.mp3 must exist')
if (existsSync(bgmPath)) {
  const size = statSync(bgmPath).size
  assert(size > 100_000, 'background music asset should contain real audio data, not a tiny placeholder')
  assert(size < 500_000, 'background music asset should stay small enough for the personal website')
}

const audio = existsSync(join(root, 'src/game/audio.ts')) ? read('src/game/audio.ts') : ''
assert(audio.includes("asset('assets/bgm-calm-loop.mp3')"), 'audio module must resolve BGM through asset()')
assert(audio.includes('new Audio'), 'audio module should use a single HTMLAudioElement')
assert(
  audio.includes('.catch(') || (audio.includes('await audio.play()') && audio.includes('catch')),
  'audio.play() must catch autoplay/load failures',
)

assert(store.includes('musicEnabled'), 'game store must track musicEnabled')
assert(store.includes('toggleMusic'), 'game store must expose toggleMusic')
assert(hud.includes('Volume2') && hud.includes('VolumeX'), 'HUD must expose music on/off icons')
assert(hud.includes('toggleMusic'), 'HUD music button must call toggleMusic')
assert(hud.includes('void playBgm(musicVolume)'), 'level selection must unlock BGM inside the user gesture')
assert(app.includes("lazy(() => import('./components/GameStage')"), '3D stage must stay behind a dynamic import')
assert(!main.includes("from './game/runtime'"), 'production entry must not statically import the Three.js runtime')
assert(texture.includes('new THREE.LoadingManager()'), 'optional textures must not reopen the global progress loader')
assert(marble.includes('crystal-marble-swirl.webp'), 'marble must use the compressed WebP texture')
assert(board.includes('pearlescent-maze-floor.webp'), 'maze floor must use the compressed WebP texture')
assert(dad.includes('dad-chaser.webp'), 'dad must use the compressed WebP texture')

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('Maze optimization guards passed')

import { lazy, Suspense, useEffect } from 'react'
import { GameErrorBoundary } from './components/GameErrorBoundary'
import { GameLoading } from './components/GameLoading'
import { HUD } from './components/HUD'
import { disposeBgm, pauseBgm, setBgmVolume } from './game/audio'
import { installInputHandlers } from './game/input'
import { useGame } from './game/store'
import { asset } from './utils/asset'

const GameStage = lazy(() => import('./components/GameStage').then((module) => ({ default: module.GameStage })))

export default function App() {
  const phase = useGame((state) => state.phase)
  const musicEnabled = useGame((state) => state.musicEnabled)
  const musicVolume = useGame((state) => state.musicVolume)
  const openLevelSelect = useGame((state) => state.openLevelSelect)

  useEffect(() => installInputHandlers(), [])

  // 背景图用 CSS 变量注入：解析成相对当前文档的绝对 URL，
  // 子路径部署时也能正确指到 /projects/<slug>/assets/。
  useEffect(() => {
    const url = new URL(asset('assets/princess-sky-garden.webp'), document.baseURI).href
    document.documentElement.style.setProperty('--sky', `url("${url}")`)
  }, [])

  useEffect(() => {
    setBgmVolume(musicVolume)
    if (!musicEnabled) pauseBgm()
  }, [musicEnabled, musicVolume])

  useEffect(() => () => disposeBgm(), [])

  return (
    <main className="app-shell">
      {phase !== 'levelSelect' && (
        <GameErrorBoundary onBack={openLevelSelect}>
          <Suspense fallback={<GameLoading />}>
            <GameStage />
          </Suspense>
        </GameErrorBoundary>
      )}
      <HUD />
    </main>
  )
}

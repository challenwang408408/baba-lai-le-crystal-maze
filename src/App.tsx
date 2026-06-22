import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene } from './components/Scene'
import { HUD } from './components/HUD'
import { disposeBgm, pauseBgm, setBgmVolume } from './game/audio'
import { installInputHandlers } from './game/input'
import { useGame } from './game/store'
import { asset } from './utils/asset'

export default function App() {
  const musicEnabled = useGame((state) => state.musicEnabled)
  const musicVolume = useGame((state) => state.musicVolume)

  useEffect(() => installInputHandlers(), [])

  // 背景图用 CSS 变量注入：解析成相对当前文档的绝对 URL，
  // 子路径部署时也能正确指到 /projects/<slug>/assets/。
  useEffect(() => {
    const url = new URL(asset('assets/princess-sky-garden.png'), document.baseURI).href
    document.documentElement.style.setProperty('--sky', `url("${url}")`)
  }, [])

  useEffect(() => {
    setBgmVolume(musicVolume)
    if (!musicEnabled) pauseBgm()
  }, [musicEnabled, musicVolume])

  useEffect(() => () => disposeBgm(), [])

  return (
    <main className="app-shell">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 10.5, 13.5], fov: 43, near: 0.1, far: 140 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <HUD />
    </main>
  )
}

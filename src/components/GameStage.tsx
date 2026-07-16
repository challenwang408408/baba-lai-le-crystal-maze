import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { Scene } from './Scene'
import { GameLoading } from './GameLoading'

export function GameStage() {
  const { active, progress } = useProgress()
  const [sceneReady, setSceneReady] = useState(false)
  const ready = sceneReady && !active

  return (
    <>
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
          <Scene onReady={() => setSceneReady(true)} />
        </Suspense>
      </Canvas>
      {!ready && <GameLoading progress={progress} />}
    </>
  )
}

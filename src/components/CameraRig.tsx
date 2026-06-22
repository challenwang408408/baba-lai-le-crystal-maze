import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useGame } from '../game/store'

export function CameraRig({ frameRadius = 14 }: { frameRadius?: number }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { camera } = useThree()
  const autoRotate = useGame((state) => state.autoRotate)
  const resetCounter = useGame((state) => state.cameraResetCounter)
  const resetCamera = useGame((state) => state.resetCamera)

  // 相机取景随迷宫尺寸缩放，关卡变大时自动拉远
  const dist = frameRadius * 0.92

  useEffect(() => {
    camera.position.set(0, dist * 0.86, dist * 1.02)
    controlsRef.current?.target.set(0, 0, 0)
    controlsRef.current?.update()
  }, [camera, resetCounter, dist])

  useEffect(() => {
    const onDoubleClick = () => resetCamera()
    window.addEventListener('dblclick', onDoubleClick)
    return () => window.removeEventListener('dblclick', onDoubleClick)
  }, [resetCamera])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={frameRadius * 0.5}
      maxDistance={frameRadius * 2.2}
      minPolarAngle={0.18}
      maxPolarAngle={1.2}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      target={[0, 0, 0]}
    />
  )
}

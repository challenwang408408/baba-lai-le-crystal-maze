import { RoundedBox } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { input } from '../game/input'
import { useGame } from '../game/store'
import type { MazeGeometry } from '../maze/generator'
import { asset } from '../utils/asset'
import { useGameTexture } from '../utils/texture'

const MAX_TILT = THREE.MathUtils.degToRad(15)
const TILT_EASE = 9.5

interface MazeBoardProps {
  geom: MazeGeometry
  children?: ReactNode
}

export function MazeBoard({ geom, children }: MazeBoardProps) {
  const boardRef = useRef<RapierRigidBody | null>(null)
  const tilt = useRef({ x: 0, z: 0 })
  const reportTimer = useRef(0)
  const mode = useGame((state) => state.mode)
  const setBoardTilt = useGame((state) => state.setBoardTilt)
  const floorTexture = useGameTexture(asset('assets/pearlescent-maze-floor.webp'), 1.35, 1.35)

  useFrame((_, delta) => {
    const body = boardRef.current
    if (!body) return

    let targetX = 0
    let targetZ = 0

    if (mode === 'board') {
      targetX = ((input.back ? 1 : 0) - (input.forward ? 1 : 0)) * MAX_TILT
      targetZ = ((input.left ? 1 : 0) - (input.right ? 1 : 0)) * MAX_TILT
    }

    const ease = 1 - Math.exp(-TILT_EASE * delta)
    tilt.current.x += (targetX - tilt.current.x) * ease
    tilt.current.z += (targetZ - tilt.current.z) * ease

    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt.current.x, 0, tilt.current.z, 'XYZ'))
    body.setNextKinematicRotation(quaternion)

    reportTimer.current += delta
    if (reportTimer.current > 0.09) {
      reportTimer.current = 0
      setBoardTilt({ x: THREE.MathUtils.radToDeg(tilt.current.x), z: THREE.MathUtils.radToDeg(tilt.current.z) })
    }
  })

  const { width, depth } = geom.boardSize
  const halfW = width / 2
  const halfD = depth / 2
  const edgeHeight = 0.9
  const edgeThickness = 0.28

  const wallPalette = useMemo(
    () => ['#ff9fc8', '#c6a8ff', '#a6eecf', '#ffd1e4', '#e5c8ff', '#f7d774'],
    [],
  )

  return (
    <RigidBody ref={boardRef} type="kinematicPosition" colliders={false}>
      <RoundedBox args={[width + 0.72, 0.18, depth + 0.72]} radius={0.22} smoothness={8} position={[0, -0.12, 0]} receiveShadow>
        <meshPhysicalMaterial color="#ffe5f2" roughness={0.22} metalness={0.04} clearcoat={0.8} clearcoatRoughness={0.18} />
      </RoundedBox>

      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshPhysicalMaterial
          map={floorTexture}
          color="#fff6fb"
          roughness={0.24}
          metalness={0.02}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.1}
        />
      </mesh>
      <CuboidCollider args={[width / 2, 0.04, depth / 2]} position={[0, 0, 0]} friction={0.48} restitution={0.05} />

      <WallBox position={[0, edgeHeight / 2, -halfD - edgeThickness / 2]} size={[width + edgeThickness * 2, edgeHeight, edgeThickness]} color="#ff8fbd" radius={0.12} />
      <WallBox position={[0, edgeHeight / 2, halfD + edgeThickness / 2]} size={[width + edgeThickness * 2, edgeHeight, edgeThickness]} color="#ff8fbd" radius={0.12} />
      <WallBox position={[-halfW - edgeThickness / 2, edgeHeight / 2, 0]} size={[edgeThickness, edgeHeight, depth + edgeThickness * 2]} color="#bda2ff" radius={0.12} />
      <WallBox position={[halfW + edgeThickness / 2, edgeHeight / 2, 0]} size={[edgeThickness, edgeHeight, depth + edgeThickness * 2]} color="#bda2ff" radius={0.12} />

      {geom.walls.map((wall, index) => (
        <WallBox
          key={`${wall.position.join(':')}-${index}`}
          position={wall.position}
          size={wall.size}
          color={wallPalette[index % wallPalette.length]}
          radius={0.07}
        />
      ))}

      {children}
    </RigidBody>
  )
}

function WallBox({
  position,
  size,
  color,
  radius,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  radius: number
}) {
  const [sx, sy, sz] = size

  return (
    <>
      <RoundedBox args={size} radius={radius} smoothness={6} position={position} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          roughness={0.25}
          metalness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.1}
          sheen={0.35}
          sheenColor="#ffffff"
          envMapIntensity={0.85}
        />
      </RoundedBox>
      <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} position={position} friction={0.34} restitution={0.12} />
    </>
  )
}

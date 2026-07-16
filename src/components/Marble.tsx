import { BallCollider, RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import { input } from '../game/input'
import { marblePosition, marbleState } from '../game/runtime'
import { useGame } from '../game/store'
import { asset } from '../utils/asset'
import { useGameTexture } from '../utils/texture'

interface MarbleProps {
  startPos: [number, number, number]
  endPos: [number, number, number]
  radius: number
  resetKey: number
}

export function Marble({ startPos, endPos, radius, resetKey }: MarbleProps) {
  const bodyRef = useRef<RapierRigidBody | null>(null)
  const innerRef = useRef<THREE.Group>(null)
  const mode = useGame((state) => state.mode)
  const slowMotion = useGame((state) => state.slowMotion)
  const start = useMemo(() => new THREE.Vector3(startPos[0], radius + 0.25, startPos[2]), [radius, startPos])

  useEffect(() => {
    resetRigidBody(bodyRef.current, start)
    marblePosition.set(start.x, start.y, start.z)
    marbleState.active = true
    return () => {
      marbleState.active = false
    }
  }, [resetKey, start])

  useFrame((_, delta) => {
    const body = bodyRef.current
    if (!body) return

    if (innerRef.current) {
      innerRef.current.rotation.y += delta * 0.55
      innerRef.current.rotation.x += delta * 0.22
    }

    const p = body.translation()
    marblePosition.set(p.x, p.y, p.z)
    if (p.y < -3.2) {
      resetRigidBody(body, start)
      marblePosition.set(start.x, start.y, start.z)
      return
    }

    const phase = useGame.getState().phase
    const playing = phase === 'playing'

    if (mode === 'marble' && playing) {
      const x = (input.right ? 1 : 0) - (input.left ? 1 : 0)
      const z = (input.back ? 1 : 0) - (input.forward ? 1 : 0)
      const length = Math.hypot(x, z)
      if (length > 0) {
        const strength = (slowMotion ? 0.042 : 0.07) * Math.min(delta * 60, 1.6)
        body.applyImpulse({ x: (x / length) * strength, y: 0, z: (z / length) * strength }, true)
        body.applyTorqueImpulse({ x: (z / length) * strength * 0.7, y: 0, z: -(x / length) * strength * 0.7 }, true)
      }
    }

    clampPlanarVelocity(body, slowMotion ? 3.8 : 6.4)

    if (playing) {
      const dx = p.x - endPos[0]
      const dz = p.z - endPos[2]
      if (dx * dx + dz * dz < 0.62 * 0.62) useGame.getState().reachGoal()
    }
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      colliders={false}
      ccd
      canSleep={false}
      position={[start.x, start.y, start.z]}
      linearDamping={0.16}
      angularDamping={0.18}
    >
      <MarbleMesh radius={radius} innerRef={innerRef} />
      <BallCollider args={[radius]} density={2.2} friction={0.36} restitution={0.22} />
    </RigidBody>
  )
}

function resetRigidBody(body: RapierRigidBody | null, position: THREE.Vector3) {
  if (!body) return
  body.setTranslation({ x: position.x, y: position.y, z: position.z }, true)
  body.setLinvel({ x: 0, y: 0, z: 0 }, true)
  body.setAngvel({ x: 0, y: 0, z: 0 }, true)
}

function clampPlanarVelocity(body: RapierRigidBody, maxSpeed: number) {
  const velocity = body.linvel()
  const speed = Math.hypot(velocity.x, velocity.z)
  if (speed <= maxSpeed) return
  body.setLinvel({ x: (velocity.x / speed) * maxSpeed, y: velocity.y, z: (velocity.z / speed) * maxSpeed }, true)
}

function MarbleMesh({
  radius,
  innerRef,
}: {
  radius: number
  innerRef: MutableRefObject<THREE.Group | null>
}) {
  const swirl = useGameTexture(asset('assets/crystal-marble-swirl.webp'))
  const bubbles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const angle = index * 2.399
        const y = -0.16 + (index % 5) * 0.08
        const r = radius * (0.26 + (index % 3) * 0.08)
        return {
          position: [Math.cos(angle) * r, y, Math.sin(angle) * r] as [number, number, number],
          size: radius * (0.035 + (index % 4) * 0.008),
        }
      }),
    [radius],
  )

  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial
          color="#ffd5ea"
          roughness={0.035}
          metalness={0}
          transmission={1}
          thickness={radius * 1.45}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={1.8}
          transparent
          opacity={0.86}
          iridescence={0.36}
          iridescenceIOR={1.35}
        />
      </mesh>

      <group ref={innerRef}>
        <mesh>
          <sphereGeometry args={[radius * 0.72, 48, 48]} />
          <meshStandardMaterial
            map={swirl}
            emissiveMap={swirl}
            emissive="#ff8fc6"
            emissiveIntensity={0.42}
            roughness={0.36}
            metalness={0}
            side={THREE.BackSide}
          />
        </mesh>
        {bubbles.map((bubble, index) => (
          <mesh key={index} position={bubble.position}>
            <sphereGeometry args={[bubble.size, 14, 14]} />
            <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={0.12} roughness={0} transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

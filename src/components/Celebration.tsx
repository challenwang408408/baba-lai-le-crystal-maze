import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGame } from '../game/store'

const colors = ['#ff78b4', '#f6c453', '#a6eecf', '#bda2ff', '#ffffff']

export function Celebration({ origin }: { origin: [number, number, number] }) {
  const completed = useGame((state) => state.phase === 'levelClear')
  const groupRef = useRef<THREE.Group>(null)
  const elapsed = useRef(0)
  const particles = useMemo(
    () =>
      Array.from({ length: 70 }, (_, index) => ({
        angle: index * 2.17,
        speed: 0.9 + (index % 7) * 0.13,
        lift: 1.4 + (index % 9) * 0.12,
        delay: (index % 12) * 0.035,
        size: 0.035 + (index % 4) * 0.012,
        color: colors[index % colors.length],
      })),
    [],
  )

  useEffect(() => {
    if (completed) elapsed.current = 0
  }, [completed])

  useFrame((_, delta) => {
    if (!completed || !groupRef.current) return
    elapsed.current += delta
    groupRef.current.children.forEach((child, index) => {
      const particle = particles[index]
      const t = Math.max(0, elapsed.current - particle.delay)
      const radius = particle.speed * t
      const y = particle.lift * Math.sin(Math.min(Math.PI, t * 1.8)) - t * 0.18
      child.position.set(
        origin[0] + Math.cos(particle.angle) * radius,
        origin[1] + 0.5 + y,
        origin[2] + Math.sin(particle.angle) * radius,
      )
      child.rotation.x += delta * (1 + (index % 5))
      child.rotation.y += delta * (0.8 + (index % 7))
      const material = (child as THREE.Mesh).material as THREE.Material
      material.opacity = Math.max(0, 1 - Math.max(0, t - 1.2) / 1.4)
    })
  })

  if (!completed) return null

  return (
    <group ref={groupRef}>
      {particles.map((particle, index) => (
        <mesh key={index} position={[origin[0], origin[1] + 0.55, origin[2]]} castShadow>
          <tetrahedronGeometry args={[particle.size, 0]} />
          <meshStandardMaterial color={particle.color} emissive={particle.color} emissiveIntensity={0.38} transparent opacity={1} roughness={0.34} />
        </mesh>
      ))}
    </group>
  )
}

import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

export function StartMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], 0.08, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.48, 64]} />
        <meshStandardMaterial color="#ffd3e8" emissive="#ff8dbc" emissiveIntensity={0.28} roughness={0.34} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <torusGeometry args={[0.48, 0.025, 12, 64]} />
        <meshStandardMaterial color="#f6c453" emissive="#f6c453" emissiveIntensity={0.35} roughness={0.2} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.09, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 0.32, 4]} />
        <meshStandardMaterial color="#ff6faa" emissive="#ff8ec5" emissiveIntensity={0.22} roughness={0.28} />
      </mesh>
    </group>
  )
}

export function FinishMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], 0.08, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.44, 0.62, 64]} />
        <meshStandardMaterial color="#b8f0d6" emissive="#7ee7b7" emissiveIntensity={0.28} roughness={0.28} side={THREE.DoubleSide} />
      </mesh>

      <group position={[0, 0.18, -0.22]}>
        <RoundedBox args={[0.74, 0.48, 0.18]} radius={0.06} smoothness={5} position={[0, 0.22, 0]} castShadow>
          <meshPhysicalMaterial color="#ffc1da" roughness={0.25} clearcoat={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.24, 0.66, 0.2]} radius={0.06} smoothness={5} position={[-0.42, 0.28, 0]} castShadow>
          <meshPhysicalMaterial color="#ffd6ec" roughness={0.26} clearcoat={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.24, 0.66, 0.2]} radius={0.06} smoothness={5} position={[0.42, 0.28, 0]} castShadow>
          <meshPhysicalMaterial color="#ffd6ec" roughness={0.26} clearcoat={0.8} />
        </RoundedBox>
        <mesh position={[-0.42, 0.72, 0]} castShadow>
          <coneGeometry args={[0.18, 0.38, 28]} />
          <meshPhysicalMaterial color="#bda2ff" roughness={0.18} metalness={0.05} clearcoat={0.9} />
        </mesh>
        <mesh position={[0.42, 0.72, 0]} castShadow>
          <coneGeometry args={[0.18, 0.38, 28]} />
          <meshPhysicalMaterial color="#bda2ff" roughness={0.18} metalness={0.05} clearcoat={0.9} />
        </mesh>
        <mesh position={[0, 0.75, 0.015]} castShadow>
          <coneGeometry args={[0.21, 0.42, 28]} />
          <meshPhysicalMaterial color="#a6eecf" roughness={0.18} metalness={0.05} clearcoat={0.9} />
        </mesh>
        <mesh position={[0, 0.33, 0.1]}>
          <boxGeometry args={[0.28, 0.32, 0.035]} />
          <meshStandardMaterial color="#fff7c8" emissive="#f6c453" emissiveIntensity={0.25} roughness={0.18} />
        </mesh>
      </group>

      <group position={[0, 1.05, -0.12]}>
        <RainbowArc radius={0.72} tube={0.026} color="#ff7ab3" />
        <RainbowArc radius={0.64} tube={0.024} color="#f6c453" />
        <RainbowArc radius={0.56} tube={0.022} color="#8fe8c2" />
        <RainbowArc radius={0.48} tube={0.02} color="#9db7ff" />
      </group>
    </group>
  )
}

function RainbowArc({ radius, tube, color }: { radius: number; tube: number; color: string }) {
  return (
    <mesh>
      <torusGeometry args={[radius, tube, 10, 80, Math.PI]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.2} />
    </mesh>
  )
}

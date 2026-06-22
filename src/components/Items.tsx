import { Billboard, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { reachableCells } from '../game/pathfinding'
import type { CellPos } from '../game/pathfinding'
import { marblePosition, marbleState } from '../game/runtime'
import { useGame } from '../game/store'
import { cellToWorld } from '../maze/generator'
import type { MazeData } from '../maze/generator'
import { useOptionalTexture } from '../utils/texture'

const FREEZE_MS = 3600

interface ItemsProps {
  maze: MazeData
  cellSize: number
  marbleRadius: number
  lunchboxCount: number
  freezeCount: number
  startCell: CellPos
  endCell: CellPos
  dadSpawnCell: CellPos
}

function rng(seed: number) {
  let v = seed >>> 0
  return () => {
    v = (v + 0x6d2b79f5) >>> 0
    let t = v
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const sameCell = (a: CellPos, b: CellPos) => a.row === b.row && a.col === b.col

export function Items({
  maze,
  cellSize,
  marbleRadius,
  lunchboxCount,
  freezeCount,
  startCell,
  endCell,
  dadSpawnCell,
}: ItemsProps) {
  const setLunchboxTotal = useGame((s) => s.setLunchboxTotal)

  const { lunchboxes, freezes } = useMemo(() => {
    const exclude = [startCell, endCell, dadSpawnCell]
    const pool = reachableCells(maze, startCell, exclude).filter(
      (c) => !exclude.some((e) => sameCell(e, c)),
    )
    // 确定性洗牌，保证同一关位置稳定
    const random = rng(maze.rows * 92821 + maze.cols * 689287 + lunchboxCount * 131 + freezeCount * 17)
    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return {
      lunchboxes: shuffled.slice(0, Math.min(lunchboxCount, shuffled.length)),
      freezes: shuffled.slice(lunchboxCount, lunchboxCount + freezeCount),
    }
  }, [maze, lunchboxCount, freezeCount, startCell, endCell, dadSpawnCell])

  useEffect(() => {
    setLunchboxTotal(lunchboxes.length)
  }, [lunchboxes.length, setLunchboxTotal])

  return (
    <group>
      {lunchboxes.map((cell, i) => (
        <Pickup
          key={`lb-${cell.row}-${cell.col}-${i}`}
          cell={cell}
          maze={maze}
          cellSize={cellSize}
          marbleRadius={marbleRadius}
          kind="lunchbox"
          glowColor="#ffb347"
          onPick={() => useGame.getState().collectLunchbox()}
        />
      ))}
      {freezes.map((cell, i) => (
        <Pickup
          key={`fz-${cell.row}-${cell.col}-${i}`}
          cell={cell}
          maze={maze}
          cellSize={cellSize}
          marbleRadius={marbleRadius}
          kind="freeze"
          glowColor="#9fe3ff"
          onPick={() => useGame.getState().activateFreeze(FREEZE_MS)}
        />
      ))}
    </group>
  )
}

interface PickupProps {
  cell: CellPos
  maze: MazeData
  cellSize: number
  marbleRadius: number
  kind: 'lunchbox' | 'freeze'
  textureUrl?: string // 缺省走 3D 造型；放进 public/assets 后传入路径即用贴图
  glowColor: string
  onPick: () => void
}

function Pickup({ cell, maze, cellSize, marbleRadius, kind, textureUrl, glowColor, onPick }: PickupProps) {
  const groupRef = useRef<THREE.Group>(null)
  const collectedRef = useRef(false)
  const tex = useOptionalTexture(textureUrl)
  const world = useMemo(() => cellToWorld(maze, cellSize, cell.row, cell.col), [maze, cellSize, cell])
  const pickRadius = marbleRadius + cellSize * 0.32

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || collectedRef.current) return
    group.rotation.y += delta * 1.4
    group.position.y = 0.5 + Math.sin((typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.004) * 0.08

    if (!marbleState.active) return
    const dx = world[0] - marblePosition.x
    const dz = world[2] - marblePosition.z
    if (Math.hypot(dx, dz) < pickRadius) {
      collectedRef.current = true
      group.visible = false
      onPick()
    }
  })

  const s = cellSize * 0.34

  return (
    <group ref={groupRef} position={[world[0], 0.5, world[2]]}>
      {tex ? (
        <Billboard>
          <mesh>
            <planeGeometry args={[cellSize * 0.5, cellSize * 0.5]} />
            <meshBasicMaterial map={tex} transparent alphaTest={0.08} toneMapped={false} />
          </mesh>
        </Billboard>
      ) : kind === 'lunchbox' ? (
        <LunchboxShape size={s} />
      ) : (
        <FreezeShape size={s} />
      )}
      <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[cellSize * 0.22, cellSize * 0.38, 28]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}

// 3D 兜底：粉彩便当盒（盒身 + 盒盖 + 小提手）
function LunchboxShape({ size }: { size: number }) {
  return (
    <group castShadow>
      <RoundedBox args={[size, size * 0.62, size * 0.78]} radius={size * 0.12} smoothness={4} position={[0, -size * 0.1, 0]} castShadow>
        <meshStandardMaterial color="#ff9ec4" roughness={0.4} metalness={0.04} />
      </RoundedBox>
      <RoundedBox args={[size * 1.04, size * 0.26, size * 0.82]} radius={size * 0.1} smoothness={4} position={[0, size * 0.26, 0]} castShadow>
        <meshStandardMaterial color="#fff3c4" roughness={0.35} metalness={0.05} emissive="#ffe08a" emissiveIntensity={0.18} />
      </RoundedBox>
      <mesh position={[0, size * 0.45, 0]}>
        <torusGeometry args={[size * 0.16, size * 0.045, 10, 24]} />
        <meshStandardMaterial color="#c79a3a" metalness={0.3} roughness={0.3} />
      </mesh>
    </group>
  )
}

// 3D 兜底：冰晶八面体（双层旋转，发光）
function FreezeShape({ size }: { size: number }) {
  return (
    <group>
      <mesh castShadow>
        <octahedronGeometry args={[size * 0.62, 0]} />
        <meshPhysicalMaterial
          color="#bfeeff"
          emissive="#7fd4ff"
          emissiveIntensity={0.4}
          roughness={0.08}
          metalness={0}
          transmission={0.6}
          thickness={size * 0.4}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 4, Math.PI / 6]}>
        <octahedronGeometry args={[size * 0.42, 0]} />
        <meshStandardMaterial color="#ffffff" emissive="#d6f5ff" emissiveIntensity={0.6} roughness={0.1} />
      </mesh>
    </group>
  )
}

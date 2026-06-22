import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CellPos } from '../game/pathfinding'
import { marblePosition, marbleState } from '../game/runtime'
import { useGame } from '../game/store'
import { cellToWorld, worldToCell } from '../maze/generator'
import type { MazeData } from '../maze/generator'
import { asset } from '../utils/asset'
import { useOptionalTexture } from '../utils/texture'

interface DadProps {
  maze: MazeData
  cellSize: number
  marbleRadius: number
  dadSpeed: number // 沿脚印前进的速度（迷宫格 / 秒）
  dadStartDelay: number // 秒
  spawnCell: CellPos
  resetKey: number
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export function Dad({ maze, cellSize, marbleRadius, dadSpeed, dadStartDelay, spawnCell, resetKey }: DadProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pos = useRef(new THREE.Vector3())
  const trail = useRef<CellPos[]>([]) // 珠子走过的脚印序列
  const trailIndex = useRef(0) // 爸爸当前走到脚印的第几格（浮点）
  const spawnTime = useRef(0)
  const caughtFired = useRef(false)
  const tex = useOptionalTexture(asset('assets/dad-chaser.png'))

  const spawnWorld = useMemo(() => {
    const [x, , z] = cellToWorld(maze, cellSize, spawnCell.row, spawnCell.col)
    return new THREE.Vector3(x, 0, z)
  }, [maze, cellSize, spawnCell])

  useEffect(() => {
    pos.current.copy(spawnWorld)
    trail.current = [{ row: spawnCell.row, col: spawnCell.col }]
    trailIndex.current = 0
    spawnTime.current = now()
    caughtFired.current = false
    groupRef.current?.position.set(spawnWorld.x, 0, spawnWorld.z)
  }, [resetKey, spawnWorld, spawnCell])

  const catchRadius = cellSize * 0.5 + marbleRadius

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    const state = useGame.getState()
    const t = now()
    const frozen = t < state.freezeUntil
    const waiting = t - spawnTime.current < dadStartDelay * 1000
    const playing = state.phase === 'playing'
    const bob = Math.sin(t * 0.005) * 0.07

    if (playing && marbleState.active) {
      // 1) 持续记录珠子脚印（头部时间内也记，这样能拉开初始间距）
      const mCell = worldToCell(maze, cellSize, marblePosition.x, marblePosition.z)
      const last = trail.current[trail.current.length - 1]
      if (!last || last.row !== mCell.row || last.col !== mCell.col) {
        trail.current.push({ row: mCell.row, col: mCell.col })
      }

      // 2) 头部时间过后、且未被冻住时，爸爸沿脚印前进
      if (!waiting && !frozen) {
        const maxIndex = trail.current.length - 1
        const speed = dadSpeed * (state.slowMotion ? 0.55 : 1)
        trailIndex.current = Math.min(trailIndex.current + speed * delta, maxIndex)

        const i0 = Math.floor(trailIndex.current)
        const i1 = Math.min(i0 + 1, maxIndex)
        const frac = trailIndex.current - i0
        const [ax, , az] = cellToWorld(maze, cellSize, trail.current[i0].row, trail.current[i0].col)
        const [bx, , bz] = cellToWorld(maze, cellSize, trail.current[i1].row, trail.current[i1].col)
        pos.current.set(ax + (bx - ax) * frac, 0, az + (bz - az) * frac)

        const dx = pos.current.x - marblePosition.x
        const dz = pos.current.z - marblePosition.z
        if (!caughtFired.current && Math.hypot(dx, dz) < catchRadius) {
          caughtFired.current = true
          useGame.getState().caught()
        }
      }
    }

    group.position.set(pos.current.x, 0.04 + bob, pos.current.z)
  })

  return (
    <group ref={groupRef}>
      <Billboard>
        {tex ? (
          <mesh position={[0, cellSize * 0.5, 0]}>
            <planeGeometry args={[cellSize * 0.95, cellSize * 0.95]} />
            <meshBasicMaterial map={tex} transparent alphaTest={0.08} toneMapped={false} />
          </mesh>
        ) : (
          <group position={[0, 0, 0]}>
            {/* 3D 兜底形象：橙衣“爸爸”，与粉色水晶珠形成对比 */}
            <mesh position={[0, marbleRadius * 1.5, 0]} castShadow>
              <coneGeometry args={[marbleRadius * 1.5, marbleRadius * 3, 18]} />
              <meshStandardMaterial color="#ff9d5c" roughness={0.5} />
            </mesh>
            <mesh position={[0, marbleRadius * 3.3, 0]} castShadow>
              <sphereGeometry args={[marbleRadius * 1.1, 24, 24]} />
              <meshStandardMaterial color="#ffd9b3" roughness={0.45} />
            </mesh>
          </group>
        )}
      </Billboard>
      <FrozenRing radius={catchRadius} />
    </group>
  )
}

// 冻结时显示的冰环（只在冻结时可见，靠 useFrame 控制透明度）
function FrozenRing({ radius }: { radius: number }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    const frozen = (typeof performance !== 'undefined' ? performance.now() : Date.now()) < useGame.getState().freezeUntil
    if (matRef.current) matRef.current.opacity = frozen ? 0.55 : 0
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <ringGeometry args={[radius * 0.7, radius * 1.05, 32]} />
      <meshBasicMaterial ref={matRef} color="#9fe3ff" transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

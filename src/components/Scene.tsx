import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { buildMazeGeometry, generateSolvableMaze, worldToCell } from '../maze/generator'
import type { MazeData } from '../maze/generator'
import { getLevelConfig } from '../game/levels'
import { nextStep } from '../game/pathfinding'
import { clearInput, setInput } from '../game/input'
import { marblePosition } from '../game/runtime'
import { useGame } from '../game/store'
import { CameraRig } from './CameraRig'
import { Celebration } from './Celebration'
import { Dad } from './Dad'
import { Items } from './Items'
import { FinishMarker, StartMarker } from './Markers'
import { Marble } from './Marble'
import { MazeBoard } from './MazeBoard'

const CELL_SIZE = 1.7
const WALL_THICKNESS = 0.18
const WALL_HEIGHT = 0.72
const MARBLE_RADIUS = 0.28

export function Scene() {
  const level = useGame((state) => state.level)
  const levelRunId = useGame((state) => state.levelRunId)
  const resetCounter = useGame((state) => state.resetCounter)
  const slowMotion = useGame((state) => state.slowMotion)

  const config = useMemo(() => getLevelConfig(level), [level])
  const maze = useMemo(
    () => generateSolvableMaze(config.rows, config.cols, config.seed),
    [config],
  )
  const geom = useMemo(
    () => buildMazeGeometry(maze, CELL_SIZE, WALL_THICKNESS, WALL_HEIGHT),
    [maze],
  )

  // 爸爸生在玩家起点（身后）：开局有头部时间，玩家先跑，爸爸从后面追，
  // 永远不会堵在前方必经路上。开局重叠期间不判定抓到（见 Dad 的 waiting 逻辑）。
  const dadSpawnCell = useMemo(
    () => ({ row: maze.start.row, col: maze.start.col }),
    [maze],
  )

  const frameRadius = Math.max(geom.boardSize.width, geom.boardSize.depth)

  return (
    <>
      <fog attach="fog" args={['#ffe8f3', frameRadius * 1.2, frameRadius * 3.4]} />
      <Lights radius={frameRadius} />

      <Physics key={`${level}-${levelRunId}`} gravity={[0, -13.5, 0]} timeStep={slowMotion ? 1 / 120 : 1 / 60}>
        <MazeBoard geom={geom}>
          <StartMarker position={geom.startWorld} />
          <FinishMarker position={geom.endWorld} />
        </MazeBoard>
        <Marble
          startPos={geom.startWorld}
          endPos={geom.endWorld}
          radius={MARBLE_RADIUS}
          resetKey={resetCounter}
        />
      </Physics>

      {/* 爸爸和道具不需要刚体，用网格寻路 + 距离判定，放在物理世界外 */}
      <Dad
        maze={maze}
        cellSize={CELL_SIZE}
        marbleRadius={MARBLE_RADIUS}
        dadSpeed={config.dadSpeed}
        dadStartDelay={config.dadStartDelay}
        spawnCell={dadSpawnCell}
        resetKey={resetCounter}
      />
      <Items
        key={levelRunId}
        maze={maze}
        cellSize={CELL_SIZE}
        marbleRadius={MARBLE_RADIUS}
        lunchboxCount={config.lunchboxCount}
        freezeCount={config.freezeCount}
        startCell={maze.start}
        endCell={maze.end}
        dadSpawnCell={dadSpawnCell}
      />

      <Sparkles count={68} size={2.2} scale={[frameRadius * 1.2, 8, frameRadius * 1.2]} position={[0, 4.2, 0]} color="#f6c453" speed={0.22} opacity={0.55} />
      <Celebration origin={geom.endWorld} />
      <Environment background={false} resolution={128}>
        <Lightformer intensity={2.4} color="#ffd6ec" position={[0, 8, 3]} scale={[13, 8, 1]} form="rect" />
        <Lightformer intensity={1.5} color="#c8b6ff" position={[-8, 4, -3]} scale={[6, 5, 1]} form="rect" />
        <Lightformer intensity={1.2} color="#b8f0d6" position={[8, 4, 1]} scale={[6, 5, 1]} form="rect" />
      </Environment>
      <CameraRig frameRadius={frameRadius} />
      {import.meta.env.DEV && <DevAutopilot maze={maze} cellSize={CELL_SIZE} endCell={maze.end} />}
    </>
  )
}

// 开发期测试用：设 window.__autopilot=true 时自动沿 BFS 解路把珠子开向终点。
// 用于验证“边跑边被追”是否可通关。生产构建会被 tree-shake。
function DevAutopilot({ maze, cellSize, endCell }: { maze: MazeData; cellSize: number; endCell: { row: number; col: number } }) {
  useFrame(() => {
    if (!(window as unknown as { __autopilot?: boolean }).__autopilot) return
    const cur = worldToCell(maze, cellSize, marblePosition.x, marblePosition.z)
    clearInput()
    const step = nextStep(maze, cur, endCell)
    if (!step) return
    if (step.row < cur.row) setInput('forward', true)
    if (step.row > cur.row) setInput('back', true)
    if (step.col < cur.col) setInput('left', true)
    if (step.col > cur.col) setInput('right', true)
  })
  return null
}

function Lights({ radius }: { radius: number }) {
  const r = Math.max(radius, 12)
  return (
    <>
      <ambientLight intensity={0.68} color="#fff3fb" />
      <directionalLight
        castShadow
        position={[r * 0.5, r * 0.9, r * 0.55]}
        intensity={1.55}
        color="#fff8fb"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-r}
        shadow-camera-right={r}
        shadow-camera-top={r}
        shadow-camera-bottom={-r}
        shadow-camera-near={1}
        shadow-camera-far={r * 3}
      />
      <pointLight position={[-5, 4.2, -5]} color="#ff9ecb" intensity={1.1} distance={r * 1.6} />
      <pointLight position={[5, 5.4, 4]} color="#a7f3d0" intensity={0.75} distance={r * 1.8} />
      <hemisphereLight args={['#fff6fb', '#d7c5ff', 0.72]} />
    </>
  )
}

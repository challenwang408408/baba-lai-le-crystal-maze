export type Direction = 'N' | 'S' | 'E' | 'W'

export interface Cell {
  row: number
  col: number
  walls: Record<Direction, boolean>
  visited: boolean
}

export interface MazeData {
  rows: number
  cols: number
  grid: Cell[][]
  start: { row: number; col: number }
  end: { row: number; col: number }
  solutionLength: number
}

export interface WallBox {
  position: [number, number, number]
  size: [number, number, number]
}

export interface MazeGeometry {
  boardSize: { width: number; depth: number }
  walls: WallBox[]
  startWorld: [number, number, number]
  endWorld: [number, number, number]
  cellSize: number
  solutionLength: number
}

function mulberry32(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const dirs = [
  { dr: -1, dc: 0, wall: 'N', opposite: 'S' },
  { dr: 1, dc: 0, wall: 'S', opposite: 'N' },
  { dr: 0, dc: 1, wall: 'E', opposite: 'W' },
  { dr: 0, dc: -1, wall: 'W', opposite: 'E' },
] as const

function makeGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      walls: { N: true, S: true, E: true, W: true },
      visited: false,
    })),
  )
}

function carveMaze(rows: number, cols: number, seed: number): MazeData {
  const random = mulberry32(seed)
  const grid = makeGrid(rows, cols)
  const stack: Cell[] = [grid[0][0]]
  grid[0][0].visited = true

  while (stack.length) {
    const current = stack[stack.length - 1]
    const candidates = dirs
      .map((dir) => ({ dir, row: current.row + dir.dr, col: current.col + dir.dc }))
      .filter(({ row, col }) => row >= 0 && row < rows && col >= 0 && col < cols && !grid[row][col].visited)

    if (!candidates.length) {
      stack.pop()
      continue
    }

    const choice = candidates[Math.floor(random() * candidates.length)]
    const next = grid[choice.row][choice.col]
    current.walls[choice.dir.wall] = false
    next.walls[choice.dir.opposite] = false
    next.visited = true
    stack.push(next)
  }

  addGentleLoops(grid, random)

  const maze: MazeData = {
    rows,
    cols,
    grid,
    start: { row: 0, col: 0 },
    end: { row: rows - 1, col: cols - 1 },
    solutionLength: 0,
  }
  maze.solutionLength = solutionLength(maze)
  return maze
}

function addGentleLoops(grid: Cell[][], random: () => number) {
  const rows = grid.length
  const cols = grid[0].length
  const loopCount = Math.floor((rows * cols) / 9)

  for (let i = 0; i < loopCount; i += 1) {
    const row = Math.floor(random() * rows)
    const col = Math.floor(random() * cols)
    const cell = grid[row][col]
    const candidates = dirs.filter((dir) => {
      const nr = row + dir.dr
      const nc = col + dir.dc
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && cell.walls[dir.wall]
    })
    if (!candidates.length) continue
    const dir = candidates[Math.floor(random() * candidates.length)]
    const neighbor = grid[row + dir.dr][col + dir.dc]
    cell.walls[dir.wall] = false
    neighbor.walls[dir.opposite] = false
  }
}

export function solutionLength(maze: MazeData) {
  const queue: Array<{ row: number; col: number; distance: number }> = [
    { row: maze.start.row, col: maze.start.col, distance: 1 },
  ]
  const seen = Array.from({ length: maze.rows }, () => Array<boolean>(maze.cols).fill(false))
  seen[maze.start.row][maze.start.col] = true

  while (queue.length) {
    const current = queue.shift()!
    if (current.row === maze.end.row && current.col === maze.end.col) return current.distance
    const cell = maze.grid[current.row][current.col]

    for (const dir of dirs) {
      const row = current.row + dir.dr
      const col = current.col + dir.dc
      if (cell.walls[dir.wall] || row < 0 || row >= maze.rows || col < 0 || col >= maze.cols || seen[row][col]) {
        continue
      }
      seen[row][col] = true
      queue.push({ row, col, distance: current.distance + 1 })
    }
  }

  return 0
}

export function isSolvable(maze: MazeData) {
  return solutionLength(maze) > 0
}

export function generateSolvableMaze(rows: number, cols: number, seed: number): MazeData {
  let best = carveMaze(rows, cols, seed)

  for (let attempt = 1; attempt <= 18; attempt += 1) {
    if (isSolvable(best) && best.solutionLength >= Math.floor((rows + cols) * 1.35)) return best
    const next = carveMaze(rows, cols, seed + attempt * 9973)
    if (next.solutionLength > best.solutionLength) best = next
  }

  return best
}

export function cellToWorld(
  maze: MazeData,
  cellSize: number,
  row: number,
  col: number,
): [number, number, number] {
  const halfW = (maze.cols * cellSize) / 2
  const halfD = (maze.rows * cellSize) / 2
  return [-halfW + col * cellSize + cellSize / 2, 0, -halfD + row * cellSize + cellSize / 2]
}

export function worldToCell(
  maze: MazeData,
  cellSize: number,
  x: number,
  z: number,
): { row: number; col: number } {
  const halfW = (maze.cols * cellSize) / 2
  const halfD = (maze.rows * cellSize) / 2
  const col = Math.floor((x + halfW) / cellSize)
  const row = Math.floor((z + halfD) / cellSize)
  return {
    row: Math.min(Math.max(row, 0), maze.rows - 1),
    col: Math.min(Math.max(col, 0), maze.cols - 1),
  }
}

export function buildMazeGeometry(
  maze: MazeData,
  cellSize: number,
  wallThickness: number,
  wallHeight: number,
): MazeGeometry {
  const width = maze.cols * cellSize
  const depth = maze.rows * cellSize
  const halfW = width / 2
  const halfD = depth / 2
  const walls: WallBox[] = []

  const cellCenter = (row: number, col: number): [number, number, number] => [
    -halfW + col * cellSize + cellSize / 2,
    0,
    -halfD + row * cellSize + cellSize / 2,
  ]

  const addWall = (x: number, z: number, sx: number, sz: number) => {
    walls.push({ position: [x, wallHeight / 2, z], size: [sx, wallHeight, sz] })
  }

  for (let row = 0; row < maze.rows; row += 1) {
    for (let col = 0; col < maze.cols; col += 1) {
      const cell = maze.grid[row][col]
      const [x, , z] = cellCenter(row, col)
      if (cell.walls.N) addWall(x, z - cellSize / 2, cellSize + wallThickness, wallThickness)
      if (cell.walls.W) addWall(x - cellSize / 2, z, wallThickness, cellSize + wallThickness)
      if (row === maze.rows - 1 && cell.walls.S) addWall(x, z + cellSize / 2, cellSize + wallThickness, wallThickness)
      if (col === maze.cols - 1 && cell.walls.E) addWall(x + cellSize / 2, z, wallThickness, cellSize + wallThickness)
    }
  }

  return {
    boardSize: { width, depth },
    walls,
    startWorld: cellCenter(maze.start.row, maze.start.col),
    endWorld: cellCenter(maze.end.row, maze.end.col),
    cellSize,
    solutionLength: maze.solutionLength,
  }
}

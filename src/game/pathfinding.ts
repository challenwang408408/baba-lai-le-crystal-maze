import type { Direction, MazeData } from '../maze/generator'

export interface CellPos {
  row: number
  col: number
}

const dirs: Array<{ dr: number; dc: number; wall: Direction }> = [
  { dr: -1, dc: 0, wall: 'N' },
  { dr: 1, dc: 0, wall: 'S' },
  { dr: 0, dc: 1, wall: 'E' },
  { dr: 0, dc: -1, wall: 'W' },
]

function key(pos: CellPos) {
  return `${pos.row},${pos.col}`
}

function inBounds(maze: MazeData, row: number, col: number) {
  return row >= 0 && row < maze.rows && col >= 0 && col < maze.cols
}

// BFS 最短路，尊重 cell.walls。返回从 from（含）到 to（含）的格子数组；不可达返回 []
export function findPath(maze: MazeData, from: CellPos, to: CellPos): CellPos[] {
  if (!inBounds(maze, from.row, from.col) || !inBounds(maze, to.row, to.col)) return []
  if (from.row === to.row && from.col === to.col) return [{ row: from.row, col: from.col }]

  const visited = new Set<string>([key(from)])
  const prev = new Map<string, CellPos>()
  const queue: CellPos[] = [from]
  let found = false

  while (queue.length) {
    const current = queue.shift()!
    if (current.row === to.row && current.col === to.col) {
      found = true
      break
    }
    const cell = maze.grid[current.row][current.col]

    for (const dir of dirs) {
      if (cell.walls[dir.wall]) continue
      const nextRow = current.row + dir.dr
      const nextCol = current.col + dir.dc
      if (!inBounds(maze, nextRow, nextCol)) continue
      const next = { row: nextRow, col: nextCol }
      const nextKey = key(next)
      if (visited.has(nextKey)) continue
      visited.add(nextKey)
      prev.set(nextKey, current)
      queue.push(next)
    }
  }

  if (!found) return []

  const path: CellPos[] = [{ row: to.row, col: to.col }]
  let cursor = key(to)
  while (cursor !== key(from)) {
    const parent = prev.get(cursor)
    if (!parent) return []
    path.push(parent)
    cursor = key(parent)
  }
  path.reverse()
  return path
}

// 从 from 朝 to 走的下一格；已在目标或不可达返回 null
export function nextStep(maze: MazeData, from: CellPos, to: CellPos): CellPos | null {
  const path = findPath(maze, from, to)
  if (path.length < 2) return null
  return path[1]
}

// 从 from 出发所有可达格子（用于撒道具），可排除若干格子
export function reachableCells(maze: MazeData, from: CellPos, exclude?: CellPos[]): CellPos[] {
  if (!inBounds(maze, from.row, from.col)) return []

  const excluded = new Set((exclude ?? []).map(key))
  const visited = new Set<string>([key(from)])
  const queue: CellPos[] = [from]
  const result: CellPos[] = []

  while (queue.length) {
    const current = queue.shift()!
    const currentKey = key(current)
    if (!excluded.has(currentKey)) result.push(current)

    const cell = maze.grid[current.row][current.col]
    for (const dir of dirs) {
      if (cell.walls[dir.wall]) continue
      const nextRow = current.row + dir.dr
      const nextCol = current.col + dir.dc
      if (!inBounds(maze, nextRow, nextCol)) continue
      const next = { row: nextRow, col: nextCol }
      const nextKey = key(next)
      if (visited.has(nextKey)) continue
      visited.add(nextKey)
      queue.push(next)
    }
  }

  return result
}

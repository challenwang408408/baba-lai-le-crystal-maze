export const TOTAL_LEVELS = 100

export interface LevelConfig {
  level: number // 1..100
  rows: number
  cols: number
  seed: number
  dadSpeed: number // 爸爸每秒移动多少个迷宫格
  dadStartDelay: number // 每次(重)生成后爸爸开始追之前的等待秒数
  lunchboxCount: number // 饭盒收集物数量
  freezeCount: number // 冻结道具数量
}

export type ProfileId = 'brother' | 'sister' | 'dad' | 'mom'

export interface Profile {
  id: ProfileId
  name: string
  emoji: string
  color: string
}

// 四个角色档：各有独立关卡进度。游戏内主角仍是水晶珠，这里只是存档身份。
export const PROFILES: Profile[] = [
  { id: 'brother', name: '哥哥', emoji: '👦', color: '#7cc4ff' },
  { id: 'sister', name: '妹妹', emoji: '👧', color: '#ff8fc6' },
  { id: 'dad', name: '爸爸', emoji: '👨', color: '#ffb56b' },
  { id: 'mom', name: '妈妈', emoji: '👩', color: '#b79bff' },
]

const ACTIVE_KEY = 'pcm-active-profile'
const progressKey = (profile: ProfileId) => `pcm-progress-${profile}`

function isProfileId(value: unknown): value is ProfileId {
  return PROFILES.some((p) => p.id === value)
}

function clampLevel(level: number) {
  return Math.min(TOTAL_LEVELS, Math.max(1, Math.round(level)))
}

// 0..1 的关卡进度，用于在各项数值之间插值
function progress(level: number) {
  return (level - 1) / (TOTAL_LEVELS - 1)
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t
}

// 由 level 确定性派生种子，保证同一关每次生成的迷宫一样
function deriveSeed(level: number) {
  return ((level * 73856093) ^ 0x9e3779b9) >>> 0
}

export function getLevelConfig(level: number): LevelConfig {
  const clamped = clampLevel(level)
  const t = progress(clamped)

  const size = Math.round(lerp(5, 15, t))
  // 爸爸踩着珠子的脚印追，速度必须低于珠子巡航速度，保证一直跑就能拉开距离。
  // 取 1.2 → 2.2 格/秒，留安全余量；压迫感来自过弯/死胡同时间距骤缩。
  const dadSpeed = lerp(0.85, 1.5, t)
  const dadStartDelay = lerp(2.6, 1.6, t)
  const lunchboxCount = Math.round(lerp(2, 6, t))
  const freezeCount = clamped < TOTAL_LEVELS / 2 ? 1 : 2

  return {
    level: clamped,
    rows: size,
    cols: size,
    seed: deriveSeed(clamped),
    dadSpeed,
    dadStartDelay,
    lunchboxCount,
    freezeCount,
  }
}

export function loadMaxUnlocked(profile: ProfileId): number {
  try {
    if (typeof localStorage === 'undefined') return 1
    const raw = localStorage.getItem(progressKey(profile))
    if (!raw) return 1
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed < 1) return 1
    return clampLevel(parsed)
  } catch {
    return 1
  }
}

export function saveMaxUnlocked(profile: ProfileId, level: number): void {
  try {
    if (typeof localStorage === 'undefined') return
    const next = clampLevel(level)
    const current = loadMaxUnlocked(profile)
    if (next > current) {
      localStorage.setItem(progressKey(profile), String(next))
    }
  } catch {
    // localStorage 不可用时静默降级
  }
}

export function loadActiveProfile(): ProfileId {
  try {
    if (typeof localStorage === 'undefined') return 'sister'
    const raw = localStorage.getItem(ACTIVE_KEY)
    return isProfileId(raw) ? raw : 'sister'
  } catch {
    return 'sister'
  }
}

export function saveActiveProfile(profile: ProfileId): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(ACTIVE_KEY, profile)
  } catch {
    // 静默降级
  }
}

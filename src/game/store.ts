import { create } from 'zustand'
import {
  TOTAL_LEVELS,
  loadActiveProfile,
  loadMaxUnlocked,
  saveActiveProfile,
  saveMaxUnlocked,
} from './levels'
import type { ProfileId } from './levels'

export type ControlMode = 'marble' | 'board'
export type GamePhase = 'levelSelect' | 'playing' | 'caught' | 'levelClear' | 'gameOver'

export const START_LIVES = 3
const MUSIC_ENABLED_KEY = 'pcm-music-enabled'
const MUSIC_VOLUME_KEY = 'pcm-music-volume'

interface GameState {
  phase: GamePhase
  profile: ProfileId
  level: number
  maxUnlocked: number
  lives: number
  lunchboxTotal: number
  lunchboxCollected: number
  freezeUntil: number // performance.now() 毫秒；now < freezeUntil 时爸爸被冻住
  mode: ControlMode
  autoRotate: boolean
  slowMotion: boolean
  musicEnabled: boolean
  musicVolume: number
  resetCounter: number // 自增以重生水晶珠和爸爸（被抓 + 换关都会变）
  levelRunId: number // 仅换关/重玩时自增；用于重置道具（被抓不变，饭盒不复活）
  cameraResetCounter: number
  boardTilt: { x: number; z: number }

  // 导航
  setProfile: (profile: ProfileId) => void
  openLevelSelect: () => void
  startLevel: (level: number) => void
  retryLevel: () => void
  nextLevel: () => void

  // 玩法事件
  setLunchboxTotal: (n: number) => void
  collectLunchbox: () => void
  activateFreeze: (ms: number) => void
  caught: () => void
  recover: () => void // 从“差点被抓到”回到游戏
  reachGoal: () => void

  // 杂项控制
  setMode: (m: ControlMode) => void
  toggleAutoRotate: () => void
  toggleSlowMotion: () => void
  toggleMusic: () => boolean
  setMusicVolume: (volume: number) => void
  resetMarble: () => void
  resetCamera: () => void
  setBoardTilt: (t: { x: number; z: number }) => void
}

const initialProfile = loadActiveProfile()

function loadMusicEnabled() {
  try {
    if (typeof localStorage === 'undefined') return true
    return localStorage.getItem(MUSIC_ENABLED_KEY) !== 'false'
  } catch {
    return true
  }
}

function saveMusicEnabled(enabled: boolean) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled))
  } catch {
    // localStorage 不可用时静默降级
  }
}

function loadMusicVolume() {
  try {
    if (typeof localStorage === 'undefined') return 0.28
    const parsed = Number.parseFloat(localStorage.getItem(MUSIC_VOLUME_KEY) ?? '')
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.28
  } catch {
    return 0.28
  }
}

function saveMusicVolume(volume: number) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(MUSIC_VOLUME_KEY, String(Math.min(1, Math.max(0, volume))))
  } catch {
    // localStorage 不可用时静默降级
  }
}

export const useGame = create<GameState>((set, get) => ({
  phase: 'levelSelect',
  profile: initialProfile,
  level: 1,
  maxUnlocked: loadMaxUnlocked(initialProfile),
  lives: START_LIVES,
  lunchboxTotal: 0,
  lunchboxCollected: 0,
  freezeUntil: 0,
  mode: 'marble',
  autoRotate: false,
  slowMotion: false,
  musicEnabled: loadMusicEnabled(),
  musicVolume: loadMusicVolume(),
  resetCounter: 0,
  levelRunId: 0,
  cameraResetCounter: 0,
  boardTilt: { x: 0, z: 0 },

  setProfile: (profile) => {
    saveActiveProfile(profile)
    set({ profile, maxUnlocked: loadMaxUnlocked(profile), phase: 'levelSelect' })
  },

  openLevelSelect: () => set({ phase: 'levelSelect' }),

  startLevel: (level) =>
    set((state) => ({
      phase: 'playing',
      level,
      lives: START_LIVES,
      lunchboxCollected: 0,
      lunchboxTotal: 0,
      freezeUntil: 0,
      mode: 'marble',
      resetCounter: state.resetCounter + 1,
      levelRunId: state.levelRunId + 1,
      cameraResetCounter: state.cameraResetCounter + 1,
    })),

  retryLevel: () => get().startLevel(get().level),

  nextLevel: () => get().startLevel(Math.min(get().level + 1, TOTAL_LEVELS)),

  setLunchboxTotal: (n) => set({ lunchboxTotal: n }),

  collectLunchbox: () => set((state) => ({ lunchboxCollected: state.lunchboxCollected + 1 })),

  activateFreeze: (ms) =>
    set({ freezeUntil: (typeof performance !== 'undefined' ? performance.now() : Date.now()) + ms }),

  caught: () =>
    set((state) => {
      const remaining = state.lives - 1
      if (remaining <= 0) {
        return { lives: 0, phase: 'gameOver' as GamePhase }
      }
      return {
        lives: remaining,
        phase: 'caught' as GamePhase,
        freezeUntil: 0,
        resetCounter: state.resetCounter + 1,
      }
    }),

  recover: () => set((state) => (state.phase === 'caught' ? { phase: 'playing' } : {})),

  reachGoal: () =>
    set((state) => {
      const unlocked = Math.min(Math.max(state.maxUnlocked, state.level + 1), TOTAL_LEVELS)
      saveMaxUnlocked(state.profile, unlocked)
      return { phase: 'levelClear', maxUnlocked: unlocked }
    }),

  setMode: (mode) => set({ mode }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  toggleSlowMotion: () => set((state) => ({ slowMotion: !state.slowMotion })),
  toggleMusic: () => {
    const musicEnabled = !get().musicEnabled
    saveMusicEnabled(musicEnabled)
    set({ musicEnabled })
    return musicEnabled
  },
  setMusicVolume: (musicVolume) => {
    const next = Math.min(1, Math.max(0, musicVolume))
    saveMusicVolume(next)
    set({ musicVolume: next })
  },
  resetMarble: () => set((state) => ({ resetCounter: state.resetCounter + 1 })),
  resetCamera: () => set((state) => ({ cameraResetCounter: state.cameraResetCounter + 1 })),
  setBoardTilt: (boardTilt) => set({ boardTilt }),
}))

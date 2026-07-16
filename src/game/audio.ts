import { asset } from '../utils/asset'

let bgm: HTMLAudioElement | null = null
let bgmVolume = 0.28

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value))
}

function getBgm() {
  if (typeof document === 'undefined') return null
  if (bgm) return bgm

  const url = new URL(asset('assets/bgm-calm-loop.mp3'), document.baseURI).href
  bgm = new Audio(url)
  bgm.loop = true
  bgm.preload = 'auto'
  bgm.volume = bgmVolume
  return bgm
}

export async function playBgm(volume = bgmVolume) {
  const audio = getBgm()
  if (!audio) return false

  bgmVolume = clampVolume(volume)
  audio.volume = bgmVolume

  try {
    await audio.play()
    return true
  } catch {
    return false
  }
}

export function pauseBgm() {
  bgm?.pause()
}

export function setBgmVolume(volume: number) {
  bgmVolume = clampVolume(volume)
  if (bgm) bgm.volume = bgmVolume
}

export function disposeBgm() {
  if (!bgm) return
  bgm.pause()
  bgm.removeAttribute('src')
  bgm.load()
  bgm = null
}

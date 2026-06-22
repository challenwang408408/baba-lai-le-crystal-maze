import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crown,
  Gauge,
  Heart,
  LayoutGrid,
  Lock,
  Play,
  RotateCcw,
  Sandwich,
  Snowflake,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { PROFILES, TOTAL_LEVELS, loadMaxUnlocked } from '../game/levels'
import { START_LIVES, useGame } from '../game/store'
import { pauseBgm, playBgm } from '../game/audio'
import { clearInput, setInput } from '../game/input'

export function HUD() {
  const phase = useGame((state) => state.phase)

  return (
    <>
      {phase !== 'levelSelect' && (
        <>
          <TitleBadge />
          <StatusBar />
          <TopControls />
          <FreezeBanner />
          <MobileDPad />
          <HelpHint />
        </>
      )}
      {phase === 'levelSelect' && <LevelSelect />}
      {phase === 'caught' && <CaughtToast />}
      {phase === 'levelClear' && <LevelClear />}
      {phase === 'gameOver' && <GameOver />}
    </>
  )
}

function TitleBadge() {
  return (
    <section className="title-badge" aria-label="游戏标题">
      <Crown size={20} strokeWidth={2.3} aria-hidden="true" />
      <h1>爸爸来了，快吃饭盒</h1>
    </section>
  )
}

function StatusBar() {
  const level = useGame((state) => state.level)
  const lives = useGame((state) => state.lives)
  const collected = useGame((state) => state.lunchboxCollected)
  const total = useGame((state) => state.lunchboxTotal)

  const profile = useGame((state) => state.profile)
  const profileInfo = PROFILES.find((p) => p.id === profile)

  return (
    <section className="status-bar" aria-label="游戏状态">
      {profileInfo && (
        <div className="status-chip profile-chip" style={{ borderColor: profileInfo.color }}>
          <span className="profile-emoji">{profileInfo.emoji}</span>
          <strong>{profileInfo.name}</strong>
        </div>
      )}
      <div className="status-chip level-chip">
        <span>第</span>
        <strong>{level}</strong>
        <span>关</span>
      </div>
      <div className="status-chip lives-chip" aria-label={`剩余 ${lives} 条命`}>
        {Array.from({ length: START_LIVES }, (_, i) => (
          <Heart
            key={i}
            size={20}
            strokeWidth={2.4}
            className={i < lives ? 'heart on' : 'heart off'}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="status-chip food-chip" aria-label={`饭盒 ${collected}/${total}`}>
        <Sandwich size={18} strokeWidth={2.3} aria-hidden="true" />
        <strong>
          {collected}/{total}
        </strong>
      </div>
    </section>
  )
}

function TopControls() {
  const openLevelSelect = useGame((state) => state.openLevelSelect)
  const retryLevel = useGame((state) => state.retryLevel)
  const resetMarble = useGame((state) => state.resetMarble)
  const slowMotion = useGame((state) => state.slowMotion)
  const toggleSlowMotion = useGame((state) => state.toggleSlowMotion)
  const musicEnabled = useGame((state) => state.musicEnabled)
  const musicVolume = useGame((state) => state.musicVolume)
  const toggleMusic = useGame((state) => state.toggleMusic)

  const handleToggleMusic = () => {
    const enabled = toggleMusic()
    if (enabled) {
      void playBgm(musicVolume)
    } else {
      pauseBgm()
    }
  }

  return (
    <section className="top-controls" aria-label="游戏控制">
      <IconButton onClick={openLevelSelect} icon={<LayoutGrid size={18} />} label="选关" />
      <IconButton onClick={retryLevel} icon={<RotateCcw size={18} />} label="重玩" />
      <IconButton onClick={resetMarble} icon={<Play size={18} />} label="回起点" />
      <IconButton active={slowMotion} onClick={toggleSlowMotion} icon={<Gauge size={18} />} label="慢动作" />
      <IconButton
        active={musicEnabled}
        onClick={handleToggleMusic}
        icon={musicEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        label="音乐"
      />
    </section>
  )
}

function IconButton({
  active,
  onClick,
  icon,
  label,
}: {
  active?: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button className={active ? 'icon-button active' : 'icon-button'} onClick={onClick} type="button" title={label} aria-label={label}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function FreezeBanner() {
  const [remain, setRemain] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      const left = useGame.getState().freezeUntil - performance.now()
      setRemain(left > 0 ? left : 0)
    }, 120)
    return () => clearInterval(id)
  }, [])
  if (remain <= 0) return null
  return (
    <div className="freeze-banner" aria-live="polite">
      <Snowflake size={18} strokeWidth={2.4} aria-hidden="true" />
      爸爸被冻住啦 {(remain / 1000).toFixed(1)}s
    </div>
  )
}

function HelpHint() {
  return (
    <aside className="help-hint">
      <ArrowUp size={13} /> <ArrowLeft size={13} /> <ArrowDown size={13} /> <ArrowRight size={13} /> 或 WASD 走迷宫，捡饭盒、躲爸爸、冲进彩虹城堡
    </aside>
  )
}

function MobileDPad() {
  const bindPointer = (key: Parameters<typeof setInput>[0], value: boolean) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setInput(key, value)
    if (value) event.currentTarget.setPointerCapture(event.pointerId)
  }

  const button = (key: Parameters<typeof setInput>[0], label: string, icon: ReactNode, className: string) => (
    <button
      className={`pad-button ${className}`}
      aria-label={label}
      title={label}
      type="button"
      onPointerDown={bindPointer(key, true)}
      onPointerUp={bindPointer(key, false)}
      onPointerLeave={bindPointer(key, false)}
      onPointerCancel={() => clearInput()}
    >
      {icon}
    </button>
  )

  return (
    <section className="mobile-pad" aria-label="移动端方向键">
      {button('forward', '向前', <ArrowUp size={22} />, 'pad-up')}
      {button('left', '向左', <ArrowLeft size={22} />, 'pad-left')}
      {button('right', '向右', <ArrowRight size={22} />, 'pad-right')}
      {button('back', '向后', <ArrowDown size={22} />, 'pad-down')}
    </section>
  )
}

function LevelSelect() {
  const maxUnlocked = useGame((state) => state.maxUnlocked)
  const startLevel = useGame((state) => state.startLevel)
  const profile = useGame((state) => state.profile)
  const setProfile = useGame((state) => state.setProfile)
  const musicEnabled = useGame((state) => state.musicEnabled)
  const musicVolume = useGame((state) => state.musicVolume)

  const handleStartLevel = (level: number) => {
    startLevel(level)
    if (musicEnabled) void playBgm(musicVolume)
  }

  return (
    <section className="level-select" role="dialog" aria-label="选择关卡">
      <div className="level-select-head">
        <Crown size={26} strokeWidth={2.3} aria-hidden="true" />
        <h1>爸爸来了，快吃饭盒</h1>
        <p>先选玩家，再选关卡。每个人有自己的关卡记录。用方向键走迷宫，捡饭盒、躲开爸爸、冲进彩虹城堡。</p>
      </div>
      <div className="profile-picker" role="group" aria-label="选择玩家">
        {PROFILES.map((p) => {
          const unlocked = loadMaxUnlocked(p.id)
          const active = p.id === profile
          return (
            <button
              key={p.id}
              type="button"
              className={active ? 'profile-card active' : 'profile-card'}
              style={active ? { borderColor: p.color, boxShadow: `0 10px 26px ${p.color}55` } : undefined}
              onClick={() => setProfile(p.id)}
            >
              <span className="profile-card-emoji">{p.emoji}</span>
              <span className="profile-card-name">{p.name}</span>
              <span className="profile-card-progress">已到第 {unlocked} 关</span>
            </button>
          )
        })}
      </div>
      <p className="level-grid-hint">已解锁 {maxUnlocked} / {TOTAL_LEVELS} 关</p>
      <div className="level-grid">
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
          const level = i + 1
          const locked = level > maxUnlocked
          return (
            <button
              key={level}
              type="button"
              className={locked ? 'level-cell locked' : level === maxUnlocked ? 'level-cell current' : 'level-cell'}
              disabled={locked}
              onClick={() => handleStartLevel(level)}
            >
              {locked ? <Lock size={14} aria-hidden="true" /> : level}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function CaughtToast() {
  const lives = useGame((state) => state.lives)
  const recover = useGame((state) => state.recover)

  useEffect(() => {
    const id = setTimeout(() => recover(), 1300)
    return () => clearTimeout(id)
  }, [recover])

  return (
    <section className="toast-layer" aria-live="assertive">
      <div className="caught-card">
        <h2>差点被爸爸抓到！</h2>
        <p>回到起点，还剩 {lives} 条命，快跑！</p>
      </div>
    </section>
  )
}

function LevelClear() {
  const level = useGame((state) => state.level)
  const collected = useGame((state) => state.lunchboxCollected)
  const total = useGame((state) => state.lunchboxTotal)
  const nextLevel = useGame((state) => state.nextLevel)
  const retryLevel = useGame((state) => state.retryLevel)
  const openLevelSelect = useGame((state) => state.openLevelSelect)
  const isFinal = level >= TOTAL_LEVELS

  return (
    <section className="complete-layer" role="dialog" aria-modal="true" aria-label="通关">
      <div className="complete-card">
        <Trophy size={34} strokeWidth={2.4} aria-hidden="true" />
        <h2>{isFinal ? '全部通关啦！' : '到达城堡啦'}</h2>
        <p>
          这一关捡到 {collected}/{total} 个饭盒。
          {isFinal ? '你是迷宫小公主冠军！' : '准备好挑战下一关了吗？'}
        </p>
        <div className="complete-actions">
          {!isFinal && (
            <button type="button" onClick={nextLevel}>
              下一关
            </button>
          )}
          <button type="button" onClick={retryLevel}>
            再玩一次
          </button>
          <button type="button" onClick={openLevelSelect}>
            选关
          </button>
        </div>
      </div>
    </section>
  )
}

function GameOver() {
  const retryLevel = useGame((state) => state.retryLevel)
  const openLevelSelect = useGame((state) => state.openLevelSelect)

  return (
    <section className="complete-layer" role="dialog" aria-modal="true" aria-label="失败">
      <div className="complete-card gameover">
        <Sandwich size={34} strokeWidth={2.4} aria-hidden="true" />
        <h2>被爸爸追上啦</h2>
        <p>三条命用完了，再试一次就能记住路线啦。</p>
        <div className="complete-actions">
          <button type="button" onClick={retryLevel}>
            再试一次
          </button>
          <button type="button" onClick={openLevelSelect}>
            选关
          </button>
        </div>
      </div>
    </section>
  )
}

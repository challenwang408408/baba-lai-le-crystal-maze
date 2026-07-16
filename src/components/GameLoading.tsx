interface GameLoadingProps {
  progress?: number
}

export function GameLoading({ progress }: GameLoadingProps) {
  const percent = progress === undefined ? null : Math.round(Math.min(100, Math.max(0, progress)))

  return (
    <section className="game-loading" role="status" aria-live="polite" aria-label="游戏加载中">
      <div className="loading-orbit" aria-hidden="true">
        <span className="loading-orbit-ring" />
        <span className="loading-orbit-marble" />
        <span className="loading-orbit-star">✦</span>
      </div>
      <h2>{percent === null ? '正在打开彩虹城堡' : '正在布置迷宫'}</h2>
      <p>{percent === null ? '3D 引擎马上就好…' : `${percent}% · 迷宫和水晶球正在就位`}</p>
      <div className="loading-track" aria-hidden="true">
        <span style={{ width: percent === null ? '36%' : `${percent}%` }} />
      </div>
    </section>
  )
}

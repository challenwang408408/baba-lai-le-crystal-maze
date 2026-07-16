import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface GameErrorBoundaryProps {
  children: ReactNode
  onBack: () => void
}

interface GameErrorBoundaryState {
  failed: boolean
}

export class GameErrorBoundary extends Component<GameErrorBoundaryProps, GameErrorBoundaryState> {
  state: GameErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): GameErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Game scene failed to load', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <section className="game-loading game-loading-error" role="alert">
        <div className="loading-error-icon" aria-hidden="true">!</div>
        <h2>迷宫没有加载成功</h2>
        <p>可能是网络刚才打了个盹，请重新试一次。</p>
        <div className="loading-error-actions">
          <button type="button" onClick={() => window.location.reload()}>重新加载</button>
          <button type="button" onClick={this.props.onBack}>返回选关</button>
        </div>
      </section>
    )
  }
}

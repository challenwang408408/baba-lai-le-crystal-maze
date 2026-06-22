import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGame } from './game/store'
import { marblePosition } from './game/runtime'

createRoot(document.getElementById('root')!).render(
  <App />,
)

// 开发期调试钩子：方便用脚本驱动和检查游戏，生产构建会被 tree-shake。
if (import.meta.env.DEV) {
  ;(window as unknown as { __game?: unknown }).__game = { useGame, marblePosition }
}

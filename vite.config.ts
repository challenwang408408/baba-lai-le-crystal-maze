import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base 用相对路径：既能在本地根路径 dev，也能部署到 challenwang.com/projects/<slug>/ 子路径，
// 资源引用全部经 import.meta.env.BASE_URL（= './'）解析，避免绝对 /assets 指到站点根。
export default defineConfig({
  base: './',
  plugins: [react()],
})

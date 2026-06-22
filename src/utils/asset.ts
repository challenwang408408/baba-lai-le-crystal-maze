// 把项目内资源相对路径解析成相对于 BASE_URL 的可用 URL。
// 本地 dev（base '/'）→ '/assets/x.png'；部署子路径（base './'）→ './assets/x.png'，
// 由浏览器相对当前文档解析，保证两种环境下素材都能正确加载。
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const clean = path.replace(/^\//, '')
  return base.endsWith('/') ? base + clean : `${base}/${clean}`
}

import { useTexture } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

// 容错加载：图片不存在或 404 也不会 suspend / 抛错，加载失败时返回 null。
// 用于 codex 生成的道具贴图——素材没就位时组件回退到纯 3D 形状。
export function useOptionalTexture(path?: string): THREE.Texture | null {
  const [loaded, setLoaded] = useState<{ path: string; texture: THREE.Texture } | null>(null)
  const texture = loaded && loaded.path === path ? loaded.texture : null

  useEffect(() => {
    if (!path) return
    let active = true
    // Optional artwork must not reopen the full-screen loader after the playable scene is ready.
    const loader = new THREE.TextureLoader(new THREE.LoadingManager())
    loader.load(
      path,
      (tex) => {
        if (!active) {
          tex.dispose()
          return
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        setLoaded({ path, texture: tex })
      },
      undefined,
      () => undefined,
    )
    return () => {
      active = false
    }
  }, [path])

  useEffect(() => () => texture?.dispose(), [texture])

  return texture
}

export function useGameTexture(path: string, repeatX = 1, repeatY = 1) {
  const source = useTexture(path)

  const texture = useMemo(() => {
    const clone = source.clone()
    clone.colorSpace = THREE.SRGBColorSpace
    clone.anisotropy = 8
    clone.wrapS = THREE.RepeatWrapping
    clone.wrapT = THREE.RepeatWrapping
    clone.repeat.set(repeatX, repeatY)
    clone.needsUpdate = true
    return clone
  }, [repeatX, repeatY, source])

  useEffect(
    () => () => {
      texture.dispose()
    },
    [texture],
  )

  return texture
}

export interface InputState {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
}

export const input: InputState = {
  forward: false,
  back: false,
  left: false,
  right: false,
}

const keyMap: Record<string, keyof InputState> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
}

let installed = false

export function setInput(key: keyof InputState, value: boolean) {
  input[key] = value
}

export function clearInput() {
  input.forward = false
  input.back = false
  input.left = false
  input.right = false
}

export function installInputHandlers(): () => void {
  if (installed) return () => undefined
  installed = true

  const onDown = (event: KeyboardEvent) => {
    const key = keyMap[event.code]
    if (!key) return
    input[key] = true
    event.preventDefault()
  }

  const onUp = (event: KeyboardEvent) => {
    const key = keyMap[event.code]
    if (!key) return
    input[key] = false
    event.preventDefault()
  }

  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)
  window.addEventListener('blur', clearInput)
  window.addEventListener('pointercancel', clearInput)

  return () => {
    window.removeEventListener('keydown', onDown)
    window.removeEventListener('keyup', onUp)
    window.removeEventListener('blur', clearInput)
    window.removeEventListener('pointercancel', clearInput)
    installed = false
    clearInput()
  }
}

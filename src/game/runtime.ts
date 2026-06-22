import * as THREE from 'three'

// 跨组件共享的运行时数据，避免用 React state 在每帧触发重渲染。
// 水晶珠每帧把自己的世界坐标写进来，爸爸（追逐者）每帧读它来寻路。
export const marblePosition = new THREE.Vector3()

// 水晶珠当前是否有效（已生成且未在重置中）。爸爸只在有效时才追。
export const marbleState = { active: false }

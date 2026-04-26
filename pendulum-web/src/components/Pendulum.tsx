import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { store } from '../store/servers'

interface Props {
  index: number
}

export default function Pendulum({ index }: Props) {
  const bobRef = useRef<Mesh>(null!)
  const config = store.servers[index]?.config
  const anchorX = config?.anchor ?? 0
  const mass = config?.mass ?? 1

  useFrame(() => {
    const { state } = store.servers[index] ?? {}
    if (!state || !bobRef.current) return
    bobRef.current.position.set(state.x - anchorX, state.y, 0)
  })

  return (
    <group position={[anchorX, 0, 0]}>
      <mesh ref={bobRef}>
        <sphereGeometry args={[0.15 * mass, 32, 32]} />
        <meshStandardMaterial color="#cdcde8" roughness={0.1} metalness={1} />
      </mesh>
    </group>
  )
}

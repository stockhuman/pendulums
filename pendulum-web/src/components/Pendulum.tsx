import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Object3D, type InstancedMesh, type Mesh } from 'three'
import { store } from '../store/servers'

interface Props {
  index: number
}

export default function Pendulum({ index }: Props) {
  const bobRef = useRef<Mesh>(null!)
  const config = store.servers[index]?.config
  const anchorX = config?.anchor ?? 0
  const mass = config?.mass ?? 1
  const chainRef = useRef<InstancedMesh>(null!)
  const LINKS = Math.floor((config?.stringLength ?? 1) * 20 - (config?.mass ?? 1) * 0.15)
  const dummy = useMemo(() => new Object3D(), [])

  useFrame(() => {
    const { state } = store.servers[index] ?? {}
    if (!state || !bobRef.current || !chainRef.current) return

    const lx = state.x - anchorX
    const ly = state.y
    bobRef.current.position.set(lx, ly, 0)

    for (let i = 0; i < LINKS; i++) {
      const t = i / (LINKS - 1)
      dummy.position.set(lx * t, ly * t, 0)
      dummy.updateMatrix()
      chainRef.current.setMatrixAt(i, dummy.matrix)
    }
    chainRef.current.instanceMatrix.needsUpdate = true
  })

  const color = useMemo(
    () =>
      `#${config?.mass?.toString(16).padStart(6, '0')}${config?.initialAngle?.toString(16).padStart(6, '0')}`,
    [config],
  )

  return (
    <group position={[anchorX, 0, 0]}>
      <instancedMesh ref={chainRef} args={[undefined, undefined, LINKS]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#cdcde8" roughness={0.1} metalness={1} />
      </instancedMesh>
      <mesh ref={bobRef}>
        <sphereGeometry args={[0.15 * mass, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={1} />
      </mesh>
    </group>
  )
}

import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Group, Object3D, Plane, Raycaster, Vector2, Vector3, type InstancedMesh, type Mesh } from 'three'
import { useSnapshot } from 'valtio'
import { store } from '../store/servers'
import { Html, Outlines } from '@react-three/drei'
import { sendControl, sendConfig } from '../services/api'

interface Props {
  index: number
}

export default function Pendulum({ index }: Props) {
  const bobRef = useRef<Mesh>(null!)
  const chainRef = useRef<InstancedMesh>(null!)
  const handleRef = useRef<Mesh>(null!)
  const groupRef = useRef<Group>(null!)
  const dummy = useMemo(() => new Object3D(), [])

  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showUI, setShowUI] = useState(false)

  const { camera, gl } = useThree()

  // Raycast against the XY plane (camera-facing); take only X from the intersection
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const raycaster = useMemo(() => new Raycaster(), [])
  const pointer = useMemo(() => new Vector2(), [])
  const intersection = useMemo(() => new Vector3(), [])

  const config = useSnapshot(store.servers[index]).config
  const anchorX = config?.anchor ?? 0
  const mass = config?.mass ?? 1
  const stringLength = config?.stringLength ?? 1
  const LINKS = Math.max(Math.floor(stringLength * 20 - mass * 0.15), 2)

  useEffect(() => {
    if (!isDraggingRef.current) handleRef.current?.position.set(anchorX, 0, 0)
  }, [anchorX])

  useEffect(() => {
    const canvas = gl.domElement

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return
      pointer.set((e.clientX / canvas.clientWidth) * 2 - 1, -(e.clientY / canvas.clientHeight) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        handleRef.current.position.set(intersection.x, 0, 0)
      }
    }

    const onPointerUp = async () => {
      if (!isDraggingRef.current) return
      const newAnchor = handleRef.current.position.x
      isDraggingRef.current = false
      setIsDragging(false)

      const entry = store.servers[index]
      if (!entry) return
      const wasRunning = entry.state?.status === 'running'
      if (wasRunning) await sendControl(entry.url, 'stop')
      await sendConfig(entry.url, { anchor: newAnchor })
      if (entry.config) entry.config.anchor = newAnchor
      if (wasRunning) await sendControl(entry.url, 'start')
    }

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
    }
    // index is the real dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDragging(true)
  }

  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    },
    [],
  )

  const onWheel = (e: WheelEvent) => {
    e.stopPropagation()
    const entry = store.servers[index]
    if (!entry || !entry.config) return

    entry.config.stringLength = entry.config.stringLength + e.deltaY * 0.001

    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    wheelTimerRef.current = setTimeout(async () => {
      const settled = store.servers[index]
      if (!settled || !settled.config) return
      const wasRunning = settled.state?.status === 'running'
      if (wasRunning) await sendControl(settled.url, 'stop')
      await sendConfig(settled.url, { stringLength: settled.config.stringLength })
      if (wasRunning) await sendControl(settled.url, 'start')
    }, 300)
  }

  useFrame(() => {
    const { state } = store.servers[index] ?? {}
    if (!groupRef.current || !bobRef.current || !chainRef.current) return

    groupRef.current.position.x = isDraggingRef.current ? handleRef.current.position.x : anchorX

    const lx = isDraggingRef.current ? 0 : state ? state.x - anchorX : 0
    const ly = isDraggingRef.current ? -stringLength : state ? state.y : -stringLength

    bobRef.current.position.set(lx, ly, 0)

    for (let i = 0; i < LINKS; i++) {
      const t = i / (LINKS - 1)
      dummy.position.set(lx * t, ly * t, 0)
      dummy.updateMatrix()
      chainRef.current.setMatrixAt(i, dummy.matrix)
    }
    chainRef.current.instanceMatrix.needsUpdate = true
  })

  const color = useMemo(() => {
    const m = config?.mass ?? 1
    const angle = config?.initialAngle ?? 0
    const r = Math.round(((m - 0.5) / 3) * 200 + 55)
    const g = Math.round((Math.abs(angle) / Math.PI) * 200 + 55)
    const b = 120
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }, [config])

  return (
    <>
      <mesh
        ref={handleRef}
        rotation={[0, 0, Math.PI / 2]}
        onPointerDown={onPointerDown}
        onPointerEnter={() => {
          document.body.style.cursor = 'grab'
          setShowUI(true)
        }}
        onPointerLeave={() => {
          document.body.style.cursor = 'default'
          setShowUI(false)
        }}
        onWheel={onWheel}
      >
        <cylinderGeometry args={[0.05, 0.05, 0.16, 32]} />
        <meshStandardMaterial color="#cdcde8" roughness={0.3} metalness={1} />
        <Outlines thickness={isDragging ? 2 : 0} color="hotpink" />
        {showUI && (
          <Html position={[0, 0, 0]} scale={0.5} color="white" pointerEvents="none">
            <PendulumDetails index={index} stringLength={stringLength} mass={mass} anchor={anchorX} />
          </Html>
        )}
      </mesh>

      <group ref={groupRef}>
        <instancedMesh ref={chainRef} args={[undefined, undefined, LINKS]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#cdcde8" roughness={0.1} metalness={1} />
        </instancedMesh>
        <mesh ref={bobRef}>
          <sphereGeometry args={[0.15 * mass, 32, 32]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={1} />
        </mesh>
      </group>
    </>
  )
}

const PendulumDetails = ({
  index,
  stringLength = 1,
  mass = 1,
  anchor = 0,
}: {
  index: number
  stringLength?: number
  mass?: number
  anchor?: number
}) => {
  return (
    <div>
      <h3>Pendulum {index + 1}</h3>
      <div>Length: {stringLength.toFixed(2)}m</div>
      <div>Mass: {mass.toFixed(2)}kg</div>
      <div>Anchor: {anchor.toFixed(2)}m</div>
    </div>
  )
}

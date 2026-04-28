export default function Bar() {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.03, 0.03, 100, 12]} />
      <meshStandardMaterial color="#303042" roughness={0.1} metalness={1} />
    </mesh>
  )
}

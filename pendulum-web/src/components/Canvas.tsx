import { Canvas as R3FCanvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import styled from 'styled-components'

export default function Canvas({ children }: { children?: React.ReactNode }) {
  return (
    <StyledCanvas>
      <color attach="background" args={[0x111111]} />
      <Environment preset="city" />
      {children}
    </StyledCanvas>
  )
}

const StyledCanvas = styled(R3FCanvas)`
  border-radius: 10px;
  height: 100%;
  width: 100%;
  border: 1px solid #3e3f44;
`

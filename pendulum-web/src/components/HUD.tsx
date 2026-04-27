import { useSnapshot } from 'valtio'
import styled from 'styled-components'
import HUDPanel from './HUDPanel'
import { store } from '../store/servers'
import { broadcastControl } from '../services/api'

export default function HUD() {
  const snap = useSnapshot(store)
  const anyRunning = snap.servers.some((s) => s.state?.status === 'running')

  return (
    <HUDPanel anchor="bottom-center">
      <Controls>
        <ControlButton onClick={() => broadcastControl(anyRunning ? 'stop' : 'start')}>
          {anyRunning ? 'Stop' : 'Start'}
        </ControlButton>
        <ControlButton $secondary onClick={() => broadcastControl('pause')} disabled={!anyRunning}>
          Pause
        </ControlButton>
      </Controls>
    </HUDPanel>
  )
}

const Controls = styled.div`
  display: flex;
  gap: 0.5rem;
`

const ControlButton = styled.button<{ $secondary?: boolean }>`
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  background: ${({ $secondary }) => ($secondary ? '#334155' : '#6366f1')};
  color: ${({ $secondary }) => ($secondary ? '#cbd5e1' : 'white')};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  &:hover {
    background: ${({ $secondary }) => ($secondary ? '#475569' : '#4f46e5')};
  }
`

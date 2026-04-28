import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Canvas from './components/Canvas'
import Settings from './components/Settings'
import { connectAll } from './services/sse'
import HUD from './components/HUD'
import Pendulum from './components/Pendulum'
import { useSnapshot } from 'valtio'
import { store } from './store/servers'
import Bar from './components/Bar'

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    connectAll()
  }, [])

  return (
    <AppWrapper>
      <CanvasArea>
        <Canvas>
          <Bar />
          <Pendulums />
        </Canvas>
        <HUD />
        <ToggleButton onClick={() => setSettingsOpen(!settingsOpen)}>
          {settingsOpen ? 'Close' : 'Servers'}
        </ToggleButton>
      </CanvasArea>
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppWrapper>
  )
}

const Pendulums = () => {
  const count = useSnapshot(store).servers.length
  return Array.from({ length: count }, (_, i) => <Pendulum key={i} index={i} />)
}

export default App

const AppWrapper = styled.div`
  display: flex;
  background: #1e293b;
  height: calc(100vh - 1rem);
  padding: 0.5rem;
`

const CanvasArea = styled.div`
  flex: 1;
  position: relative;
  min-width: 0;
`

const ToggleButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #cbd5e1;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 10;
  font-family: inherit;
  text-transform: uppercase;
  &:hover {
    color: #ffffff;
  }
`

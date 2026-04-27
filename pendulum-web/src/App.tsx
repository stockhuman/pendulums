import { useEffect } from 'react'
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
  useEffect(() => {
    connectAll()
  }, [])

  return (
    <AppWrapper>
      <Settings />
      <Canvas>
        <Bar />
        <Pendulums />
      </Canvas>
      <HUD />
    </AppWrapper>
  )
}

const Pendulums = () => {
  const count = useSnapshot(store).servers.length
  return Array.from({ length: count }, (_, i) => <Pendulum key={i} index={i} />)
}

export default App

const AppWrapper = styled.div`
  position: relative;
  background: #1e293b;
  height: calc(100vh - 1rem);
  padding: 0.5rem;
`

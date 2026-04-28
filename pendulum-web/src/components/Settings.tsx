import { useState } from 'react'
import styled from 'styled-components'
import { store, saveUrls, addServer, removeServer, setServerUrl } from '../store/servers'
import { connect, disconnect, reconnect } from '../services/sse'

export default function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<string[]>(() => store.servers.map((s) => s.url))

  const apply = () => {
    // Remove servers that were deleted
    while (store.servers.length > draft.length) {
      disconnect(store.servers.length - 1)
      removeServer(store.servers.length - 1)
    }
    // Update or add URLs
    draft.forEach((url, i) => {
      if (i < store.servers.length) {
        if (store.servers[i].url !== url) {
          setServerUrl(i, url)
          reconnect(i)
        }
      } else {
        addServer(url)
        connect(store.servers.length - 1)
      }
    })
    saveUrls(draft)
    onClose()
  }

  return (
    <Sidebar $open={open}>
      <SidebarInner>
        <PanelTitle>Pendulum Servers</PanelTitle>
        {draft.map((url, i) => (
          <Row key={i}>
            <Label>{i + 1}</Label>
            <Input
              value={url}
              onChange={(e) => setDraft(draft.map((u, j) => (j === i ? e.target.value : u)))}
              placeholder="http://localhost:300x"
            />
            <RemoveButton onClick={() => setDraft(draft.filter((_, j) => j !== i))}>✕</RemoveButton>
          </Row>
        ))}
        <AddButton onClick={() => setDraft([...draft, 'http://localhost:300' + (draft.length + 1)])}>
          + Add server
        </AddButton>
        <Actions>
          <ApplyButton onClick={apply}>Apply</ApplyButton>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
        </Actions>
      </SidebarInner>
    </Sidebar>
  )
}

const PANEL_WIDTH = 300

const Sidebar = styled.div<{ $open: boolean }>`
  width: ${({ $open }) => ($open ? `${PANEL_WIDTH}px` : '0')};
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
`

const SidebarInner = styled.div`
  width: ${PANEL_WIDTH}px;
  height: 100%;
  padding: 1rem 0rem 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-sizing: border-box;
`

const PanelTitle = styled.h3`
  margin: 0 0 0.5rem;
  color: #e2e8f0;
  font-size: 0.9rem;
  text-transform: uppercase;
  font-weight: normal;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`

const Label = styled.span`
  color: #94a3b8;
  font-size: 0.8rem;
  width: 1rem;
  text-align: right;
`

const Input = styled.input`
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #e2e8f0;
  padding: 0.3rem 0.5rem;
  font-size: 0.85rem;
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  &:hover {
    color: #f87171;
  }
`

const AddButton = styled.button`
  background: none;
  border: 1px dashed #334155;
  border-radius: 4px;
  color: #64748b;
  padding: 0.3rem;
  cursor: pointer;
  font-size: 0.8rem;
  &:hover {
    color: #e2e8f0;
    border-color: #475569;
  }
`

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
`

const ApplyButton = styled.button`
  flex: 1;
  background: #175c56;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 0.4rem;
  cursor: pointer;
  &:hover {
    background: #4f46e5;
  }
`

const CancelButton = styled.button`
  background: #334155;
  border: none;
  border-radius: 4px;
  color: #cbd5e1;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  &:hover {
    background: #475569;
  }
`

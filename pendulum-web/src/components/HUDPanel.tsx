import styled, { css } from 'styled-components'

export type Anchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center'

interface Props {
  anchor: Anchor
  children: React.ReactNode
}

export default function HUDPanel({ anchor, children }: Props) {
  return <Panel $anchor={anchor}>{children}</Panel>
}

const anchorStyles: Record<Anchor, ReturnType<typeof css>> = {
  'top-left': css`
    top: 1rem;
    left: 1rem;
  `,
  'top-right': css`
    top: 1rem;
    right: 1rem;
  `,
  'bottom-left': css`
    bottom: 1rem;
    left: 1rem;
  `,
  'bottom-right': css`
    bottom: 1rem;
    right: 1rem;
  `,
  'bottom-center': css`
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
  `,
}

const Panel = styled.div<{ $anchor: Anchor }>`
  position: absolute;
  ${({ $anchor }) => anchorStyles[$anchor]}
`

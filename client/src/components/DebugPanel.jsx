import { useGameStore } from '../store/gameStore.js'

export default function DebugPanel() {
  if (import.meta.env.VITE_NODE_ENV !== 'development') return null

  const { currentYoutubeId, timer, lastSocketEvent } = useGameStore()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        padding: '8px 12px',
        fontSize: '11px',
        maxWidth: '340px',
        maxHeight: '220px',
        overflow: 'auto',
        fontFamily: 'monospace',
        borderTop: '1px solid #0f0',
        borderLeft: '1px solid #0f0',
      }}
    >
      <strong>DEBUG</strong>
      <pre style={{ margin: '4px 0 0' }}>
        {JSON.stringify(
          {
            currentYoutubeId,
            timer,
            lastSocketEvent,
          },
          null,
          2
        )}
      </pre>
    </div>
  )
}

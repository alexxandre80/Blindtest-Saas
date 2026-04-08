import { useState, useEffect } from 'react'
import { socket } from '../../socket/socket.js'
import { EVENTS } from '../../socket/events.js'
import { useGameStore } from '../../store/gameStore.js'
import { useSound } from '../../hooks/useSound.js'
import BuzzerButton from '../../components/BuzzerButton/BuzzerButton.jsx'
import Timer from '../../components/Timer/Timer.jsx'

export default function Buzzer({ roomCode, playerId, teamId, playerName }) {
  const { play } = useSound()
  const {
    gameStatus,
    currentTrackIndex,
    timer,
    buzzerQueue,
    roundAnswer,
    scores,
  } = useGameStore()

  const [myBuzzState, setMyBuzzState] = useState(null) // null | 'waiting' | 'correct' | 'denied'
  const [myPosition, setMyPosition] = useState(null)

  // Reset sur nouvelle musique
  useEffect(() => {
    setMyBuzzState(null)
    setMyPosition(null)
  }, [currentTrackIndex])

  useEffect(() => {
    const onBuzzReceived = (data) => {
      if (data.playerId === playerId || (teamId && data.teamId === teamId)) {
        setMyBuzzState('waiting')
        setMyPosition(data.order)
      }
    }

    const onBuzzDenied = (data) => {
      if (data.playerId === playerId || (teamId && data.teamId === teamId)) {
        play('wrong')
        if (navigator.vibrate) navigator.vibrate(50)
        setMyBuzzState('denied')
        setTimeout(() => setMyBuzzState(null), 1500)
      }
    }

    const onRoundEnded = (data) => {
      if (data.winnerId === playerId || (teamId && data.winnerTeamId === teamId)) {
        setMyBuzzState('correct')
        play('point')
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      } else if (myBuzzState === 'waiting') {
        setMyBuzzState('denied')
      }
    }

    socket.on(EVENTS.BUZZ_RECEIVED, onBuzzReceived)
    socket.on(EVENTS.BUZZ_DENIED, onBuzzDenied)
    socket.on(EVENTS.ROUND_ENDED, onRoundEnded)

    return () => {
      socket.off(EVENTS.BUZZ_RECEIVED, onBuzzReceived)
      socket.off(EVENTS.BUZZ_DENIED, onBuzzDenied)
      socket.off(EVENTS.ROUND_ENDED, onRoundEnded)
    }
  }, [playerId, teamId, myBuzzState])

  useEffect(() => {
    if (gameStatus === 'playing' && timer.remaining <= 3 && timer.remaining > 0) {
      play('countdown')
    }
  }, [timer.remaining, gameStatus])

  const alreadyBuzzed = myBuzzState !== null
  const canBuzz = gameStatus === 'playing' && !alreadyBuzzed

  const myTeam = teamId
    ? scores.teams?.find((t) => t.id === teamId)
    : scores.players?.find((p) => p.id === playerId)
  const myScore = myTeam?.score ?? 0

  const handleBuzz = () => {
    if (!canBuzz) return
    if (navigator.vibrate) navigator.vibrate(200)
    play('buzz')
    socket.emit(EVENTS.BUZZ, { roomCode, playerId, teamId })
  }

  // ── Lobby ──────────────────────────────────────────────────────
  if (gameStatus === 'idle' || gameStatus === 'lobby') {
    return (
      <div style={page}>
        <div style={center}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: 2, margin: 0 }}>{roomCode}</p>
          <p style={{ fontSize: 24, fontWeight: 800, margin: '8px 0 0' }}>{playerName}</p>
          {teamId && myTeam && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{myTeam.name}</p>
          )}
          <p style={{ color: 'var(--text-muted)', marginTop: 24, fontSize: 14 }}>En attente du MJ…</p>
        </div>
      </div>
    )
  }

  // ── Round terminé ──────────────────────────────────────────────
  if (gameStatus === 'round_ended' && roundAnswer) {
    const isWinner = myBuzzState === 'correct'
    return (
      <div style={{ ...page, background: isWinner ? '#0d2818' : 'var(--bg-base)' }}>
        <div style={center}>
          {isWinner && (
            <div style={{ fontSize: 52, marginBottom: 8 }}>✓</div>
          )}
          <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{roundAnswer.title}</p>
          {roundAnswer.artist && (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 6 }}>{roundAnswer.artist}</p>
          )}
          {isWinner && (
            <p style={{ color: 'var(--color-success)', fontWeight: 800, marginTop: 16, fontSize: 20 }}>
              +1 point !
            </p>
          )}
          <p style={{ color: 'var(--text-muted)', marginTop: 24, fontSize: 13 }}>
            En attente de la prochaine musique…
          </p>
        </div>
        <ScoreFooter myScore={myScore} myTeam={myTeam} teamId={teamId} />
      </div>
    )
  }

  // ── Joueur a buzzé — attente verdict ───────────────────────────
  if (myBuzzState === 'waiting') {
    return (
      <div style={page}>
        <div style={center}>
          <div style={{ fontSize: 52, marginBottom: 12, animation: 'pulse 1s ease-in-out infinite' }}>⏳</div>
          <p style={{ fontWeight: 800, fontSize: 20 }}>Tu as buzzé !</p>
          {myPosition && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
              Position : {myPosition === 1 ? '1er' : `${myPosition}e`}
            </p>
          )}
          <p style={{ color: 'var(--text-muted)', marginTop: 16, fontSize: 14 }}>Le MJ décide…</p>
        </div>
        <ScoreFooter myScore={myScore} myTeam={myTeam} teamId={teamId} />
      </div>
    )
  }

  // ── Buzz refusé ────────────────────────────────────────────────
  if (myBuzzState === 'denied' && gameStatus !== 'round_ended') {
    return (
      <div style={{ ...page, background: '#1f0a0a' }}>
        <div style={center}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✗</div>
          <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-danger)' }}>Raté !</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 14 }}>
            {gameStatus === 'playing' ? 'Un autre peut encore buzzer…' : 'En attente…'}
          </p>
        </div>
        <ScoreFooter myScore={myScore} myTeam={myTeam} teamId={teamId} />
      </div>
    )
  }

  // ── En jeu — bouton BUZZ ───────────────────────────────────────
  const buzzerState = !canBuzz && !alreadyBuzzed ? 'disabled'
    : myBuzzState === 'correct' ? 'correct'
    : myBuzzState === 'denied'  ? 'denied'
    : myBuzzState === 'waiting' ? 'waiting'
    : 'idle'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        padding: 'env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px)',
        boxSizing: 'border-box',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, paddingTop: 16, paddingBottom: 8 }}>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          ♪ Écoute bien !
        </p>
      </div>

      {/* Corps central — timer */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 24,
          padding: '0 8px',
        }}
      >
        <Timer remaining={timer.remaining} duration={timer.duration} />

        {buzzerQueue.length > 0 && gameStatus === 'buzzed' && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            A buzzé : {buzzerQueue[0].playerName || buzzerQueue[0].teamName}
          </p>
        )}
      </div>

      {/* Footer — buzzer */}
      <div style={{ flexShrink: 0, paddingBottom: 16 }}>
        <BuzzerButton state={buzzerState} onClick={handleBuzz} />
      </div>

      <ScoreFooter myScore={myScore} myTeam={myTeam} teamId={teamId} />
    </div>
  )
}

function ScoreFooter({ myScore, myTeam, teamId }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-surface)',
        borderTop: '1px solid #2d2d4e',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {teamId && myTeam ? (
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{myTeam.name}</span>
      ) : (
        <span />
      )}
      <span style={{ fontWeight: 800, fontSize: 18 }}>
        {myScore} pt{myScore !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

const page = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100dvh',
  background: 'var(--bg-base)',
  color: 'var(--text-primary)',
  fontFamily: "'Inter', system-ui, sans-serif",
  padding: '24px 16px 80px',
  boxSizing: 'border-box',
}

const center = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: '0 24px',
}

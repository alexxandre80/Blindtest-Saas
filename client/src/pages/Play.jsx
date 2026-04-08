import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { socket } from '../socket/socket.js'
import { EVENTS } from '../socket/events.js'
import { useGameStore } from '../store/gameStore.js'
import Buzzer from '../views/player/Buzzer.jsx'
import Scoreboard from '../views/player/Scoreboard.jsx'

export default function Play() {
  const { roomCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state
  const playerName = state?.playerName
  const teamId = state?.teamId || null

  const [playerId, setPlayerId] = useState(null)
  const [connected, setConnected] = useState(false)

  const {
    gameStatus, setGameStatus,
    setTimer,
    addToBuzzerQueue, clearBuzzerQueue,
    setScores,
    setCurrentTrackIndex,
    setCurrentYoutubeId,
    setRoundAnswer,
    setLastSocketEvent,
    reset,
  } = useGameStore()

  // Rediriger si pas de state (page rechargée)
  useEffect(() => {
    if (!playerName) navigate('/join', { replace: true })
  }, [playerName])

  useEffect(() => {
    if (!playerName) return

    socket.auth = { role: 'player' }
    socket.connect()

    socket.on('connect', () => {
      socket.emit(
        EVENTS.JOIN_ROOM,
        { roomCode, role: 'player', playerName, teamId },
        (ack) => {
          if (ack?.playerId) {
            setPlayerId(ack.playerId)
            setConnected(true)
          }
        }
      )
    })

    socket.on(EVENTS.TRACK_STARTED, (data) => {
      setLastSocketEvent(EVENTS.TRACK_STARTED, data)
      setCurrentTrackIndex(data.trackIndex)
      setCurrentYoutubeId(data.youtubeId)
      setGameStatus('playing')
      clearBuzzerQueue()
      setRoundAnswer(null)
    })

    socket.on(EVENTS.TIMER_TICK, (data) => {
      setTimer({ remaining: data.remaining, duration: data.duration, isRunning: true })
    })

    socket.on(EVENTS.TIMER_END, () => {
      setTimer({ remaining: 0, isRunning: false })
    })

    socket.on(EVENTS.BUZZ_RECEIVED, (data) => {
      setLastSocketEvent(EVENTS.BUZZ_RECEIVED, data)
      addToBuzzerQueue(data)
      setGameStatus('buzzed')
    })

    socket.on(EVENTS.BUZZ_DENIED, (data) => {
      setLastSocketEvent(EVENTS.BUZZ_DENIED, data)
      setGameStatus('playing')
    })

    socket.on(EVENTS.SCORES_UPDATED, (data) => {
      setLastSocketEvent(EVENTS.SCORES_UPDATED, data)
      setScores(data)
    })

    socket.on(EVENTS.ROUND_ENDED, (data) => {
      setLastSocketEvent(EVENTS.ROUND_ENDED, data)
      setRoundAnswer(data.answer)
      setGameStatus('round_ended')
    })

    socket.on(EVENTS.GAME_ENDED, (data) => {
      setLastSocketEvent(EVENTS.GAME_ENDED, data)
      setGameStatus('ended')
    })

    return () => {
      socket.off('connect')
      socket.off(EVENTS.TRACK_STARTED)
      socket.off(EVENTS.TIMER_TICK)
      socket.off(EVENTS.TIMER_END)
      socket.off(EVENTS.BUZZ_RECEIVED)
      socket.off(EVENTS.BUZZ_DENIED)
      socket.off(EVENTS.SCORES_UPDATED)
      socket.off(EVENTS.ROUND_ENDED)
      socket.off(EVENTS.GAME_ENDED)
      if (socket.connected) {
        socket.emit(EVENTS.LEAVE_ROOM, { roomCode })
      }
      socket.disconnect()
      reset()
    }
  }, [roomCode, playerName])

  if (!playerName) return null

  if (!connected) {
    return (
      <div style={centerStyle}>
        <p style={{ color: '#6b7280' }}>Connexion en cours…</p>
      </div>
    )
  }

  if (gameStatus === 'ended') {
    return <Scoreboard roomCode={roomCode} />
  }

  return (
    <Buzzer
      roomCode={roomCode}
      playerId={playerId}
      teamId={teamId}
      playerName={playerName}
    />
  )
}

const centerStyle = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  minHeight: '100vh', fontFamily: 'sans-serif',
}

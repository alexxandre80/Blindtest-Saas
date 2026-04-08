import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { socket } from '../socket/socket.js'
import { EVENTS } from '../socket/events.js'
import { useGameStore } from '../store/gameStore.js'
import YouTubePlayer from '../components/YouTubePlayer/YouTubePlayer.jsx'
import useYouTube from '../hooks/useYouTube.js'
import { useSound } from '../hooks/useSound.js'
import { useSession } from '../lib/auth.js'
import Timer from '../components/Timer/Timer.jsx'
import TeamCard from '../components/TeamCard/TeamCard.jsx'
import Podium from '../components/Podium/Podium.jsx'
import { TEAM_COLORS } from '../styles/theme.js'

import { API } from '../config.js'

export default function HostDisplay() {
  const { roomCode } = useParams()
  const ytRef = useRef(null)
  const currentYoutubeIdRef = useRef(null)
  const { playTrack, resumeTrack, pauseTrack } = useYouTube(ytRef)
  const { play } = useSound()
  const { data: sessionData } = useSession()

  const {
    currentTrackIndex,
    setCurrentTrackIndex,
    setCurrentYoutubeId,
    timer, setTimer,
    setLastSocketEvent,
    scores, setScores,
    gameStatus, setGameStatus,
    roundAnswer, setRoundAnswer,
    clearBuzzerQueue,
  } = useGameStore()

  const [teams, setTeams] = useState([])
  const teamsRef = useRef([])
  const [lastBuzz, setLastBuzz] = useState(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  // Track previous scores for +1 delta animation
  const prevScoresRef = useRef({})
  const [scoreDeltas, setScoreDeltas] = useState({})

  useEffect(() => {
    fetch(`${API}/api/rooms/${roomCode}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((room) => {
        if (room?.teams) { setTeams(room.teams); teamsRef.current = room.teams }
      })
      .catch(() => {})
  }, [roomCode])

  useEffect(() => {
    const token = sessionData?.session?.token
    if (!token) return

    socket.auth = { token }
    socket.connect()
    socket.emit(EVENTS.JOIN_ROOM, { roomCode })

    socket.on(EVENTS.TRACK_STARTED, (data) => {
      setLastSocketEvent(EVENTS.TRACK_STARTED, data)
      setCurrentTrackIndex(data.trackIndex)
      setCurrentYoutubeId(data.youtubeId)
      currentYoutubeIdRef.current = data.youtubeId
      playTrack(data.youtubeId)
      setGameStatus('playing')
      setLastBuzz(null)
      setRoundAnswer(null)
      clearBuzzerQueue()
    })

    socket.on(EVENTS.TIMER_TICK, (data) => {
      setLastSocketEvent(EVENTS.TIMER_TICK, data)
      setTimer({ remaining: data.remaining, duration: data.duration, isRunning: true })
      if (data.remaining <= 3 && data.remaining > 0) play('countdown')
    })

    socket.on(EVENTS.TIMER_END, () => {
      setLastSocketEvent(EVENTS.TIMER_END, {})
      setTimer({ remaining: 0, isRunning: false })
    })

    socket.on(EVENTS.PAUSE_AUDIO, () => { pauseTrack() })
    socket.on(EVENTS.RESUME_AUDIO, () => { resumeTrack() })

    socket.on(EVENTS.BUZZ_RECEIVED, (data) => {
      setLastSocketEvent(EVENTS.BUZZ_RECEIVED, data)
      const teamIdx = teamsRef.current.findIndex((t) => t.id === data.teamId)
      const teamColor = teamIdx >= 0 ? TEAM_COLORS[teamIdx % TEAM_COLORS.length] : '#7c3aed'
      setLastBuzz({ playerName: data.playerName, teamName: data.teamName, teamColor })
      setGameStatus('buzzed')
      play('buzz')
    })

    socket.on(EVENTS.BUZZ_DENIED, () => {
      setGameStatus('playing')
      setLastBuzz(null)
    })

    socket.on(EVENTS.SCORES_UPDATED, (data) => {
      setLastSocketEvent(EVENTS.SCORES_UPDATED, data)
      // Compute deltas
      const entries = data.teams?.length > 0 ? data.teams : data.players ?? []
      const newDeltas = {}
      entries.forEach((entry) => {
        const prev = prevScoresRef.current[entry.id] ?? 0
        newDeltas[entry.id] = entry.score - prev
        prevScoresRef.current[entry.id] = entry.score
      })
      setScoreDeltas(newDeltas)
      setScores(data)
      setTimeout(() => setScoreDeltas({}), 1500)
    })

    socket.on(EVENTS.ROUND_ENDED, (data) => {
      setLastSocketEvent(EVENTS.ROUND_ENDED, data)
      setRoundAnswer(data.answer)
      setGameStatus('round_ended')
      play('point')
    })

    socket.on(EVENTS.GAME_ENDED, (data) => {
      setLastSocketEvent(EVENTS.GAME_ENDED, data)
      setGameStatus('ended')
    })

    return () => {
      socket.off(EVENTS.TRACK_STARTED)
      socket.off(EVENTS.TIMER_TICK)
      socket.off(EVENTS.TIMER_END)
      socket.off(EVENTS.PAUSE_AUDIO)
      socket.off(EVENTS.RESUME_AUDIO)
      socket.off(EVENTS.BUZZ_RECEIVED)
      socket.off(EVENTS.BUZZ_DENIED)
      socket.off(EVENTS.SCORES_UPDATED)
      socket.off(EVENTS.ROUND_ENDED)
      socket.off(EVENTS.GAME_ENDED)
      socket.disconnect()
    }
  }, [roomCode, sessionData?.session?.token])

  // Débloquer l'autoplay navigateur
  if (!audioUnlocked) {
    return (
      <div style={{ ...baseStyle, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => setAudioUnlocked(true)}
          style={{
            fontSize: 24,
            padding: '20px 48px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
          }}
        >
          ▶ Activer l'audio
        </button>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Requis par le navigateur pour la lecture automatique
        </p>
      </div>
    )
  }

  const isRoundEnded = gameStatus === 'round_ended' && roundAnswer
  const isBuzzed = gameStatus === 'buzzed' && lastBuzz
  const isEnded = gameStatus === 'ended'

  if (isEnded) {
    const isTeamMode = scores.teams?.length > 0
    const entries = isTeamMode
      ? [...(scores.teams || [])].sort((a, b) => b.score - a.score)
      : [...(scores.players || [])].sort((a, b) => b.score - a.score)
    return <Podium entries={entries} isTeamMode={isTeamMode} />
  }

  return (
    <div style={baseStyle}>
      {/* Buzz overlay — plein écran, persiste jusqu'à GRANT ou DENY */}
      {isBuzzed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: lastBuzz.teamColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div style={{ animation: 'buzzIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards', textAlign: 'center' }}>
            {lastBuzz.teamName && (
              <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', fontWeight: 800, margin: '0 0 8px' }}>
                {lastBuzz.teamName}
              </p>
            )}
            <p style={{ fontSize: 'clamp(4rem, 10vw, 8rem)', fontWeight: 900, margin: 0, color: '#fff', lineHeight: 1 }}>
              {lastBuzz.playerName}
            </p>
            <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)', marginTop: 16 }}>a buzzé !</p>
          </div>
        </div>
      )}

      {/* Player toujours monté — caché pendant la lecture, visible quand la réponse est révélée */}
      <div style={{ width: '100%', ...(isRoundEnded ? { aspectRatio: '16/9' } : { height: 1, overflow: 'hidden' }) }}>
        <YouTubePlayer ref={ytRef} visible={isRoundEnded} />
      </div>

      {/* Round terminé */}
      {isRoundEnded && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', margin: 0 }}>Bonne réponse :</p>
          <p style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, margin: 0 }}>{roundAnswer.title}</p>
          {roundAnswer.artist && (
            <p style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', color: 'var(--text-secondary)', margin: 0 }}>
              {roundAnswer.artist}
            </p>
          )}
          <ScoreBoard scores={scores} teams={teams} scoreDeltas={scoreDeltas} style={{ marginTop: 32 }} />
        </div>
      )}

      {/* En jeu */}
      {!isRoundEnded && !isBuzzed && (
        <>
          <h1 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: 0 }}>
            {currentTrackIndex >= 0 ? `Manche ${currentTrackIndex + 1}` : 'En attente…'}
          </h1>
          <Timer remaining={timer.remaining} duration={timer.duration} />
          <ScoreBoard scores={scores} teams={teams} scoreDeltas={scoreDeltas} />
        </>
      )}
    </div>
  )
}

function ScoreBoard({ scores, teams, scoreDeltas = {}, style }) {
  const isTeamMode = scores.teams?.length > 0
  const entries = isTeamMode
    ? [...(scores.teams || [])].sort((a, b) => b.score - a.score)
    : [...(scores.players || [])].sort((a, b) => b.score - a.score)

  if (entries.length === 0) return null

  return (
    <div style={{ ...style, width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', fontSize: 18, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
        Scores
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry, i) => {
          const teamIdx = teams.findIndex((t) => t.id === entry.id)
          const color = isTeamMode
            ? TEAM_COLORS[teamIdx >= 0 ? teamIdx : i % TEAM_COLORS.length]
            : TEAM_COLORS[i % TEAM_COLORS.length]
          return (
            <TeamCard
              key={entry.id}
              name={entry.name}
              color={color}
              score={entry.score}
              rank={i + 1}
              isLeading={i === 0}
              scoreDelta={scoreDeltas[entry.id] ?? 0}
            />
          )
        })}
      </div>
    </div>
  )
}

const baseStyle = {
  background: 'var(--bg-base)',
  color: 'var(--text-primary)',
  minHeight: '100vh',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  boxSizing: 'border-box',
}

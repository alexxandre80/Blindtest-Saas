import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore.js'
import Podium from '../../components/Podium/Podium.jsx'

export default function Scoreboard({ roomCode }) {
  const navigate = useNavigate()
  const { scores } = useGameStore()

  const isTeamMode = scores.teams?.length > 0
  const entries = isTeamMode
    ? [...(scores.teams || [])].sort((a, b) => b.score - a.score)
    : [...(scores.players || [])].sort((a, b) => b.score - a.score)

  return <Podium entries={entries} isTeamMode={isTeamMode} onReplay={() => navigate('/join')} />
}

import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/auth.js'

export default function ProtectedRoute({ children }) {
  const { data: session, isPending } = useSession()

  if (isPending) return <div style={{ padding: 40 }}>Chargement...</div>
  if (!session) return <Navigate to="/login" replace />

  return children
}

import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import HostLobby from './pages/HostLobby.jsx'
import HostControl from './pages/HostControl.jsx'
import HostDisplay from './pages/HostDisplay.jsx'
import Join from './pages/Join.jsx'
import Play from './pages/Play.jsx'
import Dashboard from './views/dashboard/Dashboard.jsx'
import BlindTestEditor from './views/dashboard/BlindTestEditor.jsx'
import Login from './views/auth/Login.jsx'
import Register from './views/auth/Register.jsx'
import ForgotPassword from './views/auth/ForgotPassword.jsx'
import ResetPassword from './views/auth/ResetPassword.jsx'
import VerifyEmail from './views/auth/VerifyEmail.jsx'
import DebugPanel from './components/DebugPanel.jsx'

export default function App() {
  return (
    <>
      <Routes>
        {/* Publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/join" element={<Join />} />
        <Route path="/play/:roomCode" element={<Play />} />

        {/* Protégées — MJ connecté */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/new" element={<ProtectedRoute><BlindTestEditor /></ProtectedRoute>} />
        <Route path="/dashboard/:id/edit" element={<ProtectedRoute><BlindTestEditor /></ProtectedRoute>} />
        <Route path="/host/:roomCode/lobby" element={<ProtectedRoute><HostLobby /></ProtectedRoute>} />
        <Route path="/host/:roomCode/control" element={<ProtectedRoute><HostControl /></ProtectedRoute>} />
        <Route path="/host/:roomCode/display" element={<ProtectedRoute><HostDisplay /></ProtectedRoute>} />
      </Routes>
      <DebugPanel />
    </>
  )
}

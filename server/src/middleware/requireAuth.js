import { auth } from '../config/auth.js'

export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' })
    }
    req.user = session.user
    req.session = session.session
    next()
  } catch {
    res.status(401).json({ error: 'Non authentifié' })
  }
}

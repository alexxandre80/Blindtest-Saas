import { Router } from 'express'
import prisma from '../db.js'
import logger from '../logger.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Public — joueurs sans compte
router.get('/:roomCode/info', async (req, res, next) => {
  try {
    const room = await prisma.room.findUnique({
      where: { code: req.params.roomCode },
      include: { teams: { orderBy: { name: 'asc' } } },
    })
    if (!room) return res.status(404).json({ error: 'Room introuvable' })
    if (room.status === 'ENDED') return res.status(410).json({ error: 'Cette partie est terminée' })
    res.json({
      code: room.code,
      status: room.status,
      isTeamMode: room.isTeamMode,
      teams: room.teams,
    })
  } catch (err) {
    next(err)
  }
})

router.use(requireAuth)

router.post('/', async (req, res, next) => {
  try {
    const { playlistId, mode = 'oral', isTeamMode = false, extractDuration = 15 } = req.body

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { _count: { select: { tracks: true } } },
    })
    if (!playlist) return res.status(404).json({ error: 'Playlist introuvable' })
    if (playlist._count.tracks === 0) {
      return res.status(400).json({ error: 'La playlist doit contenir au moins 1 musique' })
    }

    let code
    let taken = true
    while (taken) {
      code = generateRoomCode()
      taken = await prisma.room.findUnique({ where: { code } })
    }

    const room = await prisma.room.create({
      data: { code, hostId: req.user.id, playlistId, mode, isTeamMode, extractDuration },
    })

    if (isTeamMode) {
      await prisma.team.createMany({
        data: [
          { name: 'Équipe 1', roomId: room.id },
          { name: 'Équipe 2', roomId: room.id },
        ],
      })
    }

    const roomWithTeams = await prisma.room.findUnique({
      where: { id: room.id },
      include: { teams: true },
    })

    logger.info({ code, playlistId, hostId: req.user.id, isTeamMode }, 'room created')
    res.status(201).json(roomWithTeams)
  } catch (err) {
    next(err)
  }
})

router.get('/:roomCode', async (req, res, next) => {
  try {
    const room = await prisma.room.findUnique({
      where: { code: req.params.roomCode },
      include: {
        playlist: { include: { tracks: { orderBy: { order: 'asc' } } } },
        teams: { orderBy: { name: 'asc' } },
      },
    })
    if (!room) return res.status(404).json({ error: 'Room introuvable' })
    res.json(room)
  } catch (err) {
    next(err)
  }
})

export default router

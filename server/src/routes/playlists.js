import { Router } from 'express'
import prisma from '../db.js'
import logger from '../logger.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.use(requireAuth)

function extractYoutubeId(url) {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /shorts\/([A-Za-z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// ── Playlists ──────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Nom requis' })
    const playlist = await prisma.playlist.create({
      data: { name: name.trim(), userId: req.user.id },
    })
    logger.info({ id: playlist.id, userId: req.user.id }, 'playlist created')
    res.status(201).json(playlist)
  } catch (err) {
    next(err)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tracks: true } } },
    })
    res.json(playlists)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: req.params.id },
      include: { tracks: { orderBy: { order: 'asc' } } },
    })
    if (!playlist) return res.status(404).json({ error: 'Playlist introuvable' })
    res.json(playlist)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Nom requis' })
    const playlist = await prisma.playlist.update({
      where: { id: req.params.id },
      data: { name: name.trim() },
    })
    res.json(playlist)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.playlist.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// ── Tracks ─────────────────────────────────────────────────

router.post('/:id/tracks', async (req, res, next) => {
  try {
    const { youtubeUrl, title, artist } = req.body
    const youtubeId = extractYoutubeId(youtubeUrl)
    if (!youtubeId) return res.status(400).json({ error: 'URL YouTube invalide' })

    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } })
    if (!playlist) return res.status(404).json({ error: 'Playlist introuvable' })

    const agg = await prisma.track.aggregate({
      where: { playlistId: req.params.id },
      _max: { order: true },
    })
    const order = (agg._max.order ?? -1) + 1

    const track = await prisma.track.create({
      data: { playlistId: req.params.id, youtubeId, youtubeUrl, title, artist, order },
    })
    res.status(201).json(track)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id/tracks/:trackId', async (req, res, next) => {
  try {
    await prisma.track.delete({ where: { id: req.params.trackId } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/tracks/reorder', async (req, res, next) => {
  try {
    const { tracks } = req.body
    await Promise.all(
      tracks.map(({ id, order }) => prisma.track.update({ where: { id }, data: { order } }))
    )
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router

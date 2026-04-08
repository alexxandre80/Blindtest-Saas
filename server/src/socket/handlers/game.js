import { EVENTS } from '../events.js'
import prisma from '../../db.js'
import logger from '../../logger.js'
import { timers, startTimer } from './timer.js'

export function registerGameHandlers(io, socket) {
  socket.on(EVENTS.NEXT_TRACK, async ({ roomCode }) => {
    try {
      const room = await prisma.room.findUnique({
        where: { code: roomCode },
        include: {
          playlist: { include: { tracks: { orderBy: { order: 'asc' } } } },
        },
      })
      if (!room) return

      const tracks = room.playlist?.tracks ?? []
      const nextIndex = room.currentTrackIndex + 1

      if (nextIndex >= tracks.length) {
        await prisma.room.update({ where: { code: roomCode }, data: { status: 'ENDED' } })
        io.to(roomCode).emit(EVENTS.GAME_ENDED, { scores: [] })
        logger.info({ roomCode }, 'game_ended — no more tracks')
        return
      }

      const track = tracks[nextIndex]

      await prisma.room.update({
        where: { code: roomCode },
        data: { currentTrackIndex: nextIndex, status: 'PLAYING' },
      })

      // Stopper et supprimer le timer du round précédent
      const existingTimer = timers.get(roomCode)
      if (existingTimer?.interval) clearInterval(existingTimer.interval)
      timers.delete(roomCode)

      await prisma.round.create({
        data: { roomId: room.id, trackId: track.id },
      })

      io.to(roomCode).emit(EVENTS.TRACK_STARTED, {
        trackIndex: nextIndex,
        totalTracks: tracks.length,
        youtubeId: track.youtubeId,
        title: track.title,
        artist: track.artist,
      })

      startTimer(io, roomCode, room.extractDuration)
      logger.info({ roomCode, nextIndex, youtubeId: track.youtubeId }, 'track_started')
    } catch (err) {
      logger.error(err, 'next_track error')
    }
  })

  socket.on(EVENTS.STOP_GAME, async ({ roomCode }) => {
    try {
      const room = await prisma.room.update({
        where: { code: roomCode },
        data: { status: 'ENDED' },
      })

      const existingTimer = timers.get(roomCode)
      if (existingTimer?.interval) clearInterval(existingTimer.interval)
      timers.delete(roomCode)

      const [players, teams] = await Promise.all([
        prisma.player.findMany({ where: { roomId: room.id }, orderBy: { score: 'desc' } }),
        prisma.team.findMany({ where: { roomId: room.id }, orderBy: { score: 'desc' } }),
      ])

      io.to(roomCode).emit(EVENTS.GAME_ENDED, { players, teams })
      logger.info({ roomCode }, 'game_stopped_by_host')
    } catch (err) {
      logger.error(err, 'stop_game error')
    }
  })
}

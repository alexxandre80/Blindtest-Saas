import { EVENTS } from '../events.js'
import prisma from '../../db.js'
import logger from '../../logger.js'
import { timers, resumeTimer } from './timer.js'

export function registerBuzzerHandlers(io, socket, roomMjSockets) {
  socket.on(EVENTS.BUZZ, async ({ roomCode, playerId, teamId }) => {
    try {
      const room = await prisma.room.findUnique({
        where: { code: roomCode },
        include: { teams: true },
      })
      if (!room || room.status !== 'PLAYING') return

      const round = await prisma.round.findFirst({
        where: { roomId: room.id },
        orderBy: { createdAt: 'desc' },
        include: { buzzes: true },
      })
      if (!round || round.pointAwarded) return

      // Bloquer seulement si buzz en attente ou correct (pas si déjà refusé)
      const alreadyBuzzed = round.buzzes.some(
        (b) => (b.playerId === playerId || (teamId && b.teamId === teamId)) && b.wasCorrect !== false
      )
      if (alreadyBuzzed) return

      const player = await prisma.player.findUnique({ where: { id: playerId } })
      if (!player) return

      const order = round.buzzes.length + 1
      const buzz = await prisma.buzz.create({
        data: { roundId: round.id, playerId, teamId: teamId || null, order },
      })

      const team = teamId ? room.teams.find((t) => t.id === teamId) : null

      // Pause le timer serveur
      const timerState = timers.get(roomCode)
      if (timerState?.interval) {
        clearInterval(timerState.interval)
        timerState.interval = null
      }

      io.to(roomCode).emit(EVENTS.BUZZ_RECEIVED, {
        buzzId: buzz.id,
        roundId: round.id,
        playerId,
        playerName: player.name,
        teamId: teamId || null,
        teamName: team?.name || null,
        order,
        buzzedAt: buzz.buzzedAt,
      })

      const mjSocketId = roomMjSockets.get(roomCode)
      if (mjSocketId) {
        io.to(mjSocketId).emit(EVENTS.PAUSE_AUDIO)
      }

      logger.info({ roomCode, playerId, order }, 'buzz received')
    } catch (err) {
      logger.error(err, 'buzz error')
    }
  })

  socket.on(EVENTS.GRANT_POINT, async ({ roomCode, buzzId, roundId }) => {
    try {
      const room = await prisma.room.findUnique({ where: { code: roomCode } })
      if (!room) return

      const buzz = await prisma.buzz.update({
        where: { id: buzzId },
        data: { wasCorrect: true },
      })

      await prisma.round.update({
        where: { id: roundId },
        data: { pointAwarded: true },
      })

      const round = await prisma.round.findUnique({
        where: { id: roundId },
        include: { track: true },
      })

      if (room.isTeamMode && buzz.teamId) {
        await prisma.team.update({
          where: { id: buzz.teamId },
          data: { score: { increment: 1 } },
        })
      } else {
        await prisma.player.update({
          where: { id: buzz.playerId },
          data: { score: { increment: 1 } },
        })
      }

      const [players, teams] = await Promise.all([
        prisma.player.findMany({ where: { roomId: room.id }, orderBy: { score: 'desc' } }),
        prisma.team.findMany({ where: { roomId: room.id }, orderBy: { score: 'desc' } }),
      ])

      io.to(roomCode).emit(EVENTS.SCORES_UPDATED, { players, teams })
      io.to(roomCode).emit(EVENTS.ROUND_ENDED, {
        winnerId: buzz.playerId,
        winnerTeamId: buzz.teamId,
        answer: { title: round?.track.title, artist: round?.track.artist },
      })

      const mjSocketId = roomMjSockets.get(roomCode)
      if (mjSocketId) {
        io.to(mjSocketId).emit(EVENTS.RESUME_AUDIO)
      }

      logger.info({ roomCode, buzzId, roundId }, 'grant_point')
    } catch (err) {
      logger.error(err, 'grant_point error')
    }
  })

  socket.on(EVENTS.DENY_POINT, async ({ roomCode, buzzId }) => {
    try {
      const buzz = await prisma.buzz.update({
        where: { id: buzzId },
        data: { wasCorrect: false },
      })

      io.to(roomCode).emit(EVENTS.BUZZ_DENIED, {
        buzzId,
        playerId: buzz.playerId,
        teamId: buzz.teamId,
      })

      const mjSocketId = roomMjSockets.get(roomCode)
      if (mjSocketId) {
        io.to(mjSocketId).emit(EVENTS.RESUME_AUDIO)
      }

      resumeTimer(io, roomCode)

      logger.info({ roomCode, buzzId }, 'deny_point')
    } catch (err) {
      logger.error(err, 'deny_point error')
    }
  })
}

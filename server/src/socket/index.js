import { EVENTS } from './events.js'
import logger from '../logger.js'
import { auth } from '../config/auth.js'
import prisma from '../db.js'
import { registerGameHandlers } from './handlers/game.js'
import { registerTimerHandlers } from './handlers/timer.js'
import { registerBuzzerHandlers } from './handlers/buzzer.js'

// roomCode → socketId du MJ (host authentifié)
const roomMjSockets = new Map()

export function setupSocket(io) {
  // Middleware d'auth — bypass pour les joueurs sans compte
  io.use(async (socket, next) => {
    if (socket.handshake.auth?.role === 'player') return next()

    try {
      const headers = { ...socket.handshake.headers }
      // Accepte un token de session passé via socket.auth.token
      // (valeur brute du cookie better-auth.session_token)
      const token = socket.handshake.auth?.token
      if (token) {
        const existing = headers['cookie'] || ''
        headers['cookie'] = existing
          ? `${existing}; better-auth.session_token=${token}`
          : `better-auth.session_token=${token}`
      }

      const session = await auth.api.getSession({ headers })
      if (!session) return next(new Error('Non authentifié'))
      socket.user = session.user
      next()
    } catch {
      next(new Error("Erreur d'authentification"))
    }
  })

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id, userId: socket.user?.id }, 'Client connected')

    socket.on(EVENTS.JOIN_ROOM, async (data, ack) => {
      const { roomCode, role, playerName, teamId } = data
      socket.join(roomCode)
      socket.roomCode = roomCode

      if (role === 'player') {
        try {
          const room = await prisma.room.findUnique({ where: { code: roomCode } })
          if (!room) {
            if (typeof ack === 'function') ack({ error: 'Room introuvable' })
            return
          }

          const player = await prisma.player.upsert({
            where: { socketId: socket.id },
            create: {
              socketId: socket.id,
              name: playerName,
              roomId: room.id,
              teamId: teamId || null,
            },
            update: {
              name: playerName,
              roomId: room.id,
              teamId: teamId || null,
            },
          })

          socket.playerId = player.id
          logger.debug({ socketId: socket.id, playerId: player.id, roomCode }, 'player joined')

          io.to(roomCode).emit(EVENTS.PLAYER_JOINED, {
            socketId: socket.id,
            playerId: player.id,
            playerName: player.name,
            teamId: player.teamId,
          })

          if (typeof ack === 'function') ack({ playerId: player.id })
        } catch (err) {
          logger.error(err, 'join_room player error')
          if (typeof ack === 'function') ack({ error: 'Erreur serveur' })
        }
      } else {
        // MJ authentifié
        roomMjSockets.set(roomCode, socket.id)
        logger.debug({ socketId: socket.id, roomCode }, 'mj joined')
        io.to(roomCode).emit(EVENTS.PLAYER_JOINED, { socketId: socket.id, ...data })
        if (typeof ack === 'function') ack({})
      }
    })

    socket.on(EVENTS.LEAVE_ROOM, (data) => {
      const { roomCode } = data
      logger.debug({ socketId: socket.id, roomCode }, 'leave_room')
      socket.leave(roomCode)
      if (roomMjSockets.get(roomCode) === socket.id) {
        roomMjSockets.delete(roomCode)
      }
      io.to(roomCode).emit(EVENTS.PLAYER_LEFT, { socketId: socket.id })
    })

    registerGameHandlers(io, socket)
    registerTimerHandlers(io, socket)
    registerBuzzerHandlers(io, socket, roomMjSockets)

    socket.on('disconnect', (reason) => {
      if (socket.roomCode && roomMjSockets.get(socket.roomCode) === socket.id) {
        roomMjSockets.delete(socket.roomCode)
      }
      logger.info({ socketId: socket.id, reason }, 'Client disconnected')
    })
  })
}

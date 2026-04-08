import { EVENTS } from '../events.js'
import logger from '../../logger.js'
import prisma from '../../db.js'

// roomCode → { interval, remaining, duration }
export const timers = new Map()

async function onTimerExpired(io, roomCode) {
  io.to(roomCode).emit(EVENTS.TIMER_END)
  logger.info({ roomCode }, 'timer_end')

  try {
    const room = await prisma.room.findUnique({ where: { code: roomCode } })
    if (!room) return
    const round = await prisma.round.findFirst({
      where: { roomId: room.id, pointAwarded: false },
      orderBy: { createdAt: 'desc' },
      include: { track: true },
    })
    if (round) {
      await prisma.round.update({ where: { id: round.id }, data: { pointAwarded: true } })
      io.to(roomCode).emit(EVENTS.ROUND_ENDED, {
        answer: { title: round.track.title, artist: round.track.artist },
      })
      logger.info({ roomCode }, 'round_ended — timer expired')
    }
  } catch (err) {
    logger.error(err, 'auto round_end error')
  }
}

function startInterval(io, roomCode, state) {
  const interval = setInterval(async () => {
    state.remaining -= 1
    io.to(roomCode).emit(EVENTS.TIMER_TICK, { remaining: state.remaining, duration: state.duration })
    logger.debug({ roomCode, remaining: state.remaining }, 'timer_tick')

    if (state.remaining <= 0) {
      clearInterval(interval)
      state.interval = null
      timers.delete(roomCode)
      await onTimerExpired(io, roomCode)
    }
  }, 1000)
  state.interval = interval
}

export function startTimer(io, roomCode, duration) {
  const existing = timers.get(roomCode)
  if (existing?.interval) clearInterval(existing.interval)
  const state = { interval: null, remaining: duration, duration }
  timers.set(roomCode, state)
  startInterval(io, roomCode, state)
  io.to(roomCode).emit(EVENTS.TIMER_TICK, { remaining: duration, duration })
}

export function resumeTimer(io, roomCode) {
  const state = timers.get(roomCode)
  if (!state || state.interval) return // Pas de timer ou déjà en cours
  startInterval(io, roomCode, state)
  io.to(roomCode).emit(EVENTS.TIMER_TICK, { remaining: state.remaining })
  logger.info({ roomCode, remaining: state.remaining }, 'timer_resumed')
}

export function registerTimerHandlers(io, socket) {
  socket.on(EVENTS.TIMER_START, ({ duration, roomCode }) => {
    const existing = timers.get(roomCode)
    if (existing?.interval) clearInterval(existing.interval)

    const state = { interval: null, remaining: duration, duration }
    timers.set(roomCode, state)
    startInterval(io, roomCode, state)
    logger.info({ roomCode, duration }, 'timer_start')
  })

  socket.on(EVENTS.TIMER_PAUSE, ({ roomCode }) => {
    const state = timers.get(roomCode)
    if (!state) return
    clearInterval(state.interval)
    state.interval = null
    logger.info({ roomCode, remaining: state.remaining }, 'timer_pause')
  })

  socket.on(EVENTS.TIMER_RESET, ({ roomCode }) => {
    const state = timers.get(roomCode)
    if (!state) return
    clearInterval(state.interval)
    timers.set(roomCode, { interval: null, remaining: state.duration, duration: state.duration })
    io.to(roomCode).emit(EVENTS.TIMER_TICK, { remaining: state.duration })
    logger.info({ roomCode }, 'timer_reset')
  })
}

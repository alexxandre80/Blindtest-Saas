import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { toNodeHandler } from 'better-auth/node'
import logger from './logger.js'
import { auth } from './config/auth.js'
import { errorHandler } from './middleware/errorHandler.js'
import healthRouter from './routes/health.js'
import playlistRouter from './routes/playlists.js'
import roomsRouter from './routes/rooms.js'
import { setupSocket } from './socket/index.js'
import prisma from './db.js'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Better Auth — doit être avant express.json()
app.all('/api/auth/*', toNodeHandler(auth))

app.use(express.json())
app.use(healthRouter)
app.use('/api/playlists', playlistRouter)
app.use('/api/rooms', roomsRouter)
app.use(errorHandler)

// Dev : redirige les routes non-API vers le client Vite
if (process.env.NODE_ENV === 'development') {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  app.get('*', (req, res) => res.redirect(`${clientUrl}${req.path}`))
}

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
})

setupSocket(io)

const PORT = process.env.PORT || 3001

async function start() {
  try {
    await prisma.$connect()
    logger.info('Database connected')
    httpServer.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server listening')
    })
  } catch (err) {
    logger.error(err, 'Failed to start server')
    process.exit(1)
  }
}

start()

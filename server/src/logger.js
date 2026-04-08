import pino from 'pino'

const logger = pino(
  process.env.NODE_ENV === 'development'
    ? {
        level: process.env.LOG_LEVEL || 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }
    : {
        level: process.env.LOG_LEVEL || 'info',
      }
)

export default logger

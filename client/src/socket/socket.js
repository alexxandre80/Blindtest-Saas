import { io } from 'socket.io-client'
import { API } from '../config.js'

const URL = API

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
})

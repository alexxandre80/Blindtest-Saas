import { create } from 'zustand'

export const useGameStore = create((set) => ({
  room: null,
  players: [],
  teams: [],
  currentTrack: null,
  scores: { teams: [], players: [] },
  gameStatus: 'idle', // idle | lobby | playing | buzzed | round_ended | ended

  // Phase 2
  currentPlaylist: null,
  playlist: [],
  currentTrackIndex: -1,
  currentYoutubeId: null,
  timer: {
    duration: 15,
    remaining: 15,
    isRunning: false,
  },
  lastSocketEvent: null,

  // Phase 3
  buzzerQueue: [],       // file d'attente des buzzers du round en cours
  roundAnswer: null,     // { title, artist } révélé en fin de round

  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  setTeams: (teams) => set({ teams }),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),
  setScores: (scores) => set({ scores }),
  setGameStatus: (gameStatus) => set({ gameStatus }),
  setCurrentPlaylist: (currentPlaylist) => set({ currentPlaylist }),
  setPlaylist: (playlist) => set({ playlist }),
  setCurrentTrackIndex: (currentTrackIndex) => set({ currentTrackIndex }),
  setCurrentYoutubeId: (currentYoutubeId) => set({ currentYoutubeId }),
  setTimer: (patch) => set((s) => ({ timer: { ...s.timer, ...patch } })),
  setLastSocketEvent: (event, data) =>
    set({ lastSocketEvent: { event, data, ts: new Date().toISOString() } }),
  setBuzzerQueue: (buzzerQueue) => set({ buzzerQueue }),
  addToBuzzerQueue: (buzz) => set((s) => ({ buzzerQueue: [...s.buzzerQueue, buzz] })),
  removeBuzzFromQueue: (buzzId) => set((s) => ({ buzzerQueue: s.buzzerQueue.filter((b) => b.buzzId !== buzzId) })),
  clearBuzzerQueue: () => set({ buzzerQueue: [] }),
  setRoundAnswer: (roundAnswer) => set({ roundAnswer }),

  reset: () =>
    set({
      room: null,
      players: [],
      teams: [],
      currentTrack: null,
      scores: { teams: [], players: [] },
      gameStatus: 'idle',
      currentPlaylist: null,
      playlist: [],
      currentTrackIndex: -1,
      currentYoutubeId: null,
      timer: { duration: 15, remaining: 15, isRunning: false },
      lastSocketEvent: null,
      buzzerQueue: [],
      roundAnswer: null,
    }),
}))

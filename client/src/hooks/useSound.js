// Sons attendus dans client/public/sounds/ :
//   buzz.mp3, point.mp3, wrong.mp3, countdown.mp3
// Si le fichier est absent, le son est simplement ignoré.

const cache = {}

function getAudio(name) {
  if (!cache[name]) {
    cache[name] = new Audio(`/sounds/${name}.mp3`)
    cache[name].preload = 'auto'
  }
  return cache[name]
}

export function useSound() {
  const play = (name) => {
    try {
      const audio = getAudio(name)
      audio.currentTime = 0
      audio.play().catch(() => {})
    } catch {}
  }

  return { play }
}

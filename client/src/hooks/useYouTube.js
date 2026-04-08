export default function useYouTube(playerRef) {
  return {
    playTrack: (videoId) => playerRef.current?.play(videoId),
    resumeTrack: () => playerRef.current?.resume(),
    pauseTrack: () => playerRef.current?.pause(),
    stopTrack: () => playerRef.current?.stop(),
  }
}

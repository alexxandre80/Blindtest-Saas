import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const YouTubePlayer = forwardRef(function YouTubePlayer({ visible = false }, ref) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    const initPlayer = () => {
      if (playerRef.current || !containerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 0, controls: 0 },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      // Chaîner avec un éventuel callback déjà enregistré
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        initPlayer()
      }

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.body.appendChild(script)
      }
    }
  }, [])

  useImperativeHandle(ref, () => ({
    play(videoId) {
      if (!playerRef.current) return
      playerRef.current.loadVideoById(videoId)
      playerRef.current.playVideo()
    },
    resume() {
      playerRef.current?.playVideo()
    },
    pause() {
      playerRef.current?.pauseVideo()
    },
    stop() {
      playerRef.current?.stopVideo()
    },
    getCurrentTime() {
      return playerRef.current?.getCurrentTime() ?? 0
    },
  }))

  return (
    <div
      style={{
        visibility: visible ? 'visible' : 'hidden',
        width: visible ? '100%' : '1px',
        height: visible ? '100%' : '1px',
        overflow: 'hidden',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
})

export default YouTubePlayer

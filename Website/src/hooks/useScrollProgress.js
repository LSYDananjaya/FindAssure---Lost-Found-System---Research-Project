import { useEffect, useState } from 'react'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function useScrollProgress(ref, { start = 0.88, end = 0.12 } = {}) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return undefined
    }

    let frameId = 0

    const update = () => {
      frameId = 0
      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const startLine = viewportHeight * start
      const endLine = viewportHeight * end
      const totalDistance = rect.height + (startLine - endLine)
      const next = clamp((startLine - rect.top) / Math.max(totalDistance, 1), 0, 1)

      setProgress((current) => (Math.abs(current - next) < 0.001 ? current : next))
    }

    const scheduleUpdate = () => {
      if (frameId) {
        return
      }

      frameId = window.requestAnimationFrame(update)
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [end, ref, start])

  return progress
}


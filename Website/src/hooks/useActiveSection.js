import { useEffect, useState } from 'react'

export function useActiveSection(sectionIds) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? '')

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    if (!sections.length) {
      return undefined
    }

    let frameId = 0

    const getBestSection = () => {
      const viewportHeight = window.innerHeight
      const focusLine = viewportHeight * 0.36

      return sections.reduce(
        (best, section) => {
          const rect = section.getBoundingClientRect()
          const isVisible = rect.bottom > 0 && rect.top < viewportHeight
          const clampedFocus = Math.min(Math.max(focusLine, rect.top), rect.bottom)
          const distance = Math.abs(clampedFocus - focusLine)
          const visibilityBonus = isVisible ? 0 : viewportHeight * 0.35

          if (distance + visibilityBonus < best.score) {
            return { id: section.id, score: distance + visibilityBonus }
          }

          return best
        },
        { id: sections[0].id, score: Number.POSITIVE_INFINITY },
      ).id
    }

    const updateActiveSection = () => {
      frameId = 0
      setActiveSection((current) => {
        const next = getBestSection()
        return current === next ? current : next
      })
    }

    const scheduleUpdate = () => {
      if (frameId) {
        return
      }

      frameId = window.requestAnimationFrame(updateActiveSection)
    }

    const observer = new IntersectionObserver(
      () => {
        scheduleUpdate()
      },
      {
        rootMargin: '-12% 0px -55% 0px',
        threshold: [0, 0.15, 0.3, 0.6, 1],
      },
    )

    sections.forEach((section) => observer.observe(section))
    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [sectionIds])

  return activeSection
}

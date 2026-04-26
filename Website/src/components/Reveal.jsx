import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function Reveal({
  children,
  className = '',
  delay = 0,
  distance = 18,
  once = true,
  threshold = 0.14,
  variant = 'fade-up',
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(prefersReducedMotion)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return undefined
    }

    if (prefersReducedMotion()) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) {
            observer.disconnect()
          }
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold, rootMargin: '-4% 0px -12% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once, threshold])

  return (
    <div
      className={`reveal-base ${className}`}
      data-reveal-variant={variant}
      data-reveal-visible={visible}
      ref={ref}
      style={{
        '--reveal-delay': `${delay}ms`,
        '--reveal-distance': `${distance}px`,
      }}
    >
      {children}
    </div>
  )
}

export default Reveal

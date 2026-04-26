import { useEffect, useRef, useState } from 'react'

function DownloadIcon({ className }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 4.5v8.2m0 0 3.2-3.2M12 12.7 8.8 9.5M5 16.7v.8c0 1 .8 1.8 1.8 1.8h10.4c1 0 1.8-.8 1.8-1.8v-.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function getGoogleFileId(fileUrl) {
  if (!fileUrl) {
    return null
  }

  try {
    const url = new URL(fileUrl)

    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/)
    if (pathMatch?.[1]) {
      return pathMatch[1]
    }

    const openId = url.searchParams.get('id')
    if (openId) {
      return openId
    }

    if (url.pathname === '/uc') {
      const ucId = url.searchParams.get('id')
      if (ucId) {
        return ucId
      }
    }

    const slideMatch = url.pathname.match(/\/presentation\/d\/([^/]+)/)
    if (slideMatch?.[1]) {
      return slideMatch[1]
    }

    return null
  } catch {
    return null
  }
}

function getDirectDownloadUrl(fileUrl) {
  if (!fileUrl) {
    return null
  }

  try {
    const url = new URL(fileUrl)
    const fileId = getGoogleFileId(fileUrl)

    if (!fileId) {
      return null
    }

    if (url.hostname.includes('docs.google.com') && url.pathname.includes('/presentation/')) {
      return `https://docs.google.com/presentation/d/${fileId}/export/pptx`
    }

    if (url.hostname.includes('drive.google.com')) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`
    }

    return null
  } catch {
    return null
  }
}

function normalizeDownloadUrls(fileUrl) {
  const directDownloadUrl = getDirectDownloadUrl(fileUrl)
  return directDownloadUrl ? [directDownloadUrl] : []
}

function DownloadPlaceholderButton({ fileUrl, label }) {
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef(null)
  const directDownloadUrls = normalizeDownloadUrls(fileUrl)
  const isInteractive = directDownloadUrls.length > 0

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const triggerAnimation = () => {
    setIsAnimating(false)

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    window.requestAnimationFrame(() => {
      setIsAnimating(true)
      timeoutRef.current = window.setTimeout(() => {
        setIsAnimating(false)
        timeoutRef.current = null
      }, 240)
    })
  }

  const handleClick = (event) => {
    triggerAnimation()

    if (!isInteractive) {
      event.preventDefault()
      return
    }
  }

  const directDownloadUrl = directDownloadUrls[0]
  const content = (
    <>
      <span className="download-placeholder-button-inner">
        <span className="download-placeholder-icon-shell">
          <DownloadIcon className="download-placeholder-icon" />
        </span>
        <span className="download-placeholder-label">{label}</span>
      </span>
      <span aria-hidden="true" className="download-placeholder-sheen" />
    </>
  )

  if (isInteractive) {
    return (
      <a
        aria-disabled="false"
        className="download-placeholder-button md:min-w-[11rem]"
        data-animating={isAnimating}
        href={directDownloadUrl}
        onClick={handleClick}
        rel="noopener noreferrer"
      >
        {content}
      </a>
    )
  }

  return (
    <button
      aria-disabled="true"
      className="download-placeholder-button md:min-w-[11rem]"
      data-animating={isAnimating}
      onClick={handleClick}
      type="button"
    >
      {content}
    </button>
  )
}

export default DownloadPlaceholderButton

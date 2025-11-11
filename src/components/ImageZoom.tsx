import React, { useEffect, useRef } from 'react'
import mediumZoom, { Zoom } from 'medium-zoom'

interface ImageZoomProps {
  src: string
  alt: string
  className?: string
}

const ImageZoom: React.FC<ImageZoomProps> = ({ src, alt, className }) => {
  const imgRef = useRef<HTMLImageElement>(null)
  const zoomRef = useRef<Zoom | null>(null)

  useEffect(() => {
    if (!imgRef.current) return

    // Clean up any existing zoom instance
    if (zoomRef.current) {
      zoomRef.current.detach()
      zoomRef.current = null
    }

    // Wait for image to load before attaching zoom
    const img = imgRef.current
    const attachZoom = () => {
      // Get computed background color from CSS variable
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#000000'

      zoomRef.current = mediumZoom(img, {
        background: bgColor,
        margin: 24,
      })
    }

    if (img.complete) {
      // Image already loaded
      attachZoom()
    } else {
      // Wait for image to load
      img.addEventListener('load', attachZoom, { once: true })
    }

    return () => {
      if (zoomRef.current) {
        zoomRef.current.detach()
        zoomRef.current = null
      }
    }
  }, [src]) // Re-initialize when src changes

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      style={{ cursor: 'zoom-in' }}
    />
  )
}

export default ImageZoom

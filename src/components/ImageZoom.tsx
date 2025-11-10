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
    if (imgRef.current && !zoomRef.current) {
      // Get computed background color from CSS variable
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#000000'
      
      zoomRef.current = mediumZoom(imgRef.current, {
        background: bgColor,
        margin: 24,
      })
    }

    return () => {
      if (zoomRef.current) {
        zoomRef.current.detach()
        zoomRef.current = null
      }
    }
  }, [])

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

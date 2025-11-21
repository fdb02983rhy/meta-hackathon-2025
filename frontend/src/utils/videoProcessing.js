/**
 * Captures a frame from a video element and returns it as a base64 string or blob
 */
export const captureFrame = (videoElement, options = {}) => {
  const {
    format = 'base64', // 'base64' or 'blob'
    quality = 0.8,
    mimeType = 'image/jpeg',
    scale = 1
  } = options

  if (!videoElement) return null

  const canvas = document.createElement('canvas')
  const width = videoElement.videoWidth * scale
  const height = videoElement.videoHeight * scale

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoElement, 0, 0, width, height)

  if (format === 'blob') {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        mimeType,
        quality
      )
    })
  }

  return canvas.toDataURL(mimeType, quality)
}

/**
 * Frame throttler class for controlling frame capture rate
 */
export class FrameThrottler {
  constructor(intervalMs = 1000) {
    this.intervalMs = intervalMs
    this.lastCaptureTime = 0
  }

  shouldCapture() {
    const now = Date.now()
    if (now - this.lastCaptureTime >= this.intervalMs) {
      this.lastCaptureTime = now
      return true
    }
    return false
  }

  reset() {
    this.lastCaptureTime = 0
  }

  setInterval(intervalMs) {
    this.intervalMs = intervalMs
  }
}

/**
 * Draws segmentation overlay on a canvas
 */
export const drawSegmentationOverlay = (canvas, segmentationData, options = {}) => {
  const {
    opacity = 0.5,
    colorMap = null,
    showBorders = true,
    borderColor = '#00ff00',
    borderWidth = 2
  } = options

  if (!canvas || !segmentationData) return

  const ctx = canvas.getContext('2d')
  ctx.save()

  // Set global alpha for transparency
  ctx.globalAlpha = opacity

  // Draw segmentation mask
  if (segmentationData.mask) {
    const imageData = ctx.createImageData(canvas.width, canvas.height)

    // Apply color mapping to segmentation mask
    for (let i = 0; i < segmentationData.mask.length; i++) {
      const pixelIndex = i * 4
      const segmentClass = segmentationData.mask[i]

      if (colorMap && colorMap[segmentClass]) {
        const color = colorMap[segmentClass]
        imageData.data[pixelIndex] = color[0]     // R
        imageData.data[pixelIndex + 1] = color[1] // G
        imageData.data[pixelIndex + 2] = color[2] // B
        imageData.data[pixelIndex + 3] = 255      // A
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  // Draw bounding boxes if available
  if (showBorders && segmentationData.boxes) {
    ctx.globalAlpha = 1
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderWidth

    segmentationData.boxes.forEach(box => {
      const { x, y, width, height, label } = box

      // Draw rectangle
      ctx.strokeRect(x, y, width, height)

      // Draw label if available
      if (label) {
        ctx.font = '14px Arial'
        ctx.fillStyle = borderColor
        ctx.fillRect(x, y - 20, ctx.measureText(label).width + 8, 20)
        ctx.fillStyle = '#000'
        ctx.fillText(label, x + 4, y - 5)
      }
    })
  }

  ctx.restore()
}

/**
 * Creates a composite video with overlay
 */
export class VideoCompositor {
  constructor(videoElement, overlayCanvas) {
    this.videoElement = videoElement
    this.overlayCanvas = overlayCanvas
    this.compositeCanvas = document.createElement('canvas')
    this.isRunning = false
    this.animationId = null
  }

  start() {
    if (this.isRunning) return

    this.isRunning = true
    this.updateCanvasSize()
    this.render()
  }

  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  updateCanvasSize() {
    if (this.videoElement) {
      this.compositeCanvas.width = this.videoElement.videoWidth
      this.compositeCanvas.height = this.videoElement.videoHeight
      this.overlayCanvas.width = this.videoElement.videoWidth
      this.overlayCanvas.height = this.videoElement.videoHeight
    }
  }

  render = () => {
    if (!this.isRunning) return

    const ctx = this.compositeCanvas.getContext('2d')

    // Draw video frame
    ctx.drawImage(this.videoElement, 0, 0)

    // Draw overlay
    ctx.drawImage(this.overlayCanvas, 0, 0)

    this.animationId = requestAnimationFrame(this.render)
  }

  getCanvas() {
    return this.compositeCanvas
  }
}
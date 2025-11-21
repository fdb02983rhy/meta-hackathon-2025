import { useRef, useState, useEffect, useCallback } from 'react'
import websocketService from '../services/websocket'
import {
  captureFrame,
  FrameThrottler,
  drawSegmentationOverlay,
  VideoCompositor
} from '../utils/videoProcessing'

const VideoInput = ({ uploadedImage, onClearImage }) => {
  const videoRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const compositeCanvasRef = useRef(null)
  const frameThrottlerRef = useRef(new FrameThrottler(1000)) // Dinov3: 1 frame per second
  const samThrottlerRef = useRef(new FrameThrottler(33)) // SAM: ~30fps
  const compositorRef = useRef(null)
  const streamIntervalRef = useRef(null)

  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [showOverlay, setShowOverlay] = useState(true)
  const [segmentationData, setSegmentationData] = useState(null)
  const [dinov3Results, setDinov3Results] = useState(null)

  // WebSocket event handlers
  useEffect(() => {
    const handleConnection = (data) => {
      setConnectionStatus(data.status)
      if (data.status === 'connected' && isStreaming) {
        startFrameCapture()
      }
    }

    const handleSegmentation = (data) => {
      setSegmentationData(data)
      if (showOverlay && overlayCanvasRef.current) {
        drawSegmentationOverlay(overlayCanvasRef.current, data, {
          opacity: 0.5,
          showBorders: true,
          borderColor: '#00ff00'
        })
      }
    }

    const handleDinov3 = (data) => {
      setDinov3Results(data)
      console.log('Dinov3 analysis:', data)
    }

    const handleError = (error) => {
      console.error('WebSocket error:', error)
      setError(`Streaming error: ${error.message}`)
    }

    websocketService.on('connection', handleConnection)
    websocketService.on('segmentation', handleSegmentation)
    websocketService.on('dinov3', handleDinov3)
    websocketService.on('error', handleError)

    return () => {
      websocketService.off('connection', handleConnection)
      websocketService.off('segmentation', handleSegmentation)
      websocketService.off('dinov3', handleDinov3)
      websocketService.off('error', handleError)
    }
  }, [isStreaming, showOverlay])

  const startCamera = async () => {
    setIsLoading(true)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false // No audio needed for streaming
      })

      setStream(mediaStream)
      setError(null)
    } catch (err) {
      setError(`Camera error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const startStreaming = useCallback(() => {
    if (!stream) {
      setError('No video stream available')
      return
    }

    setIsStreaming(true)

    // Connect WebSocket if not already connected
    if (!websocketService.isConnected()) {
      websocketService.connect()
    } else {
      startFrameCapture()
    }
  }, [stream])

  const startFrameCapture = useCallback(() => {
    if (!videoRef.current || !isStreaming) return

    // Clear any existing interval
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
    }

    // Initialize compositor for overlay
    if (!compositorRef.current && overlayCanvasRef.current) {
      compositorRef.current = new VideoCompositor(
        videoRef.current,
        overlayCanvasRef.current
      )
      compositorRef.current.start()
    }

    // Start frame capture loop
    streamIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !websocketService.isConnected()) return

      try {
        // Capture frame for SAM (high frequency)
        if (samThrottlerRef.current.shouldCapture()) {
          const samFrame = await captureFrame(videoRef.current, {
            format: 'base64',
            quality: 0.7,
            scale: 0.5 // Scale down for faster processing
          })

          websocketService.sendFrame({
            type: 'sam',
            frame: samFrame,
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          })
        }

        // Capture frame for Dinov3 (low frequency)
        if (frameThrottlerRef.current.shouldCapture()) {
          const dinov3Frame = await captureFrame(videoRef.current, {
            format: 'base64',
            quality: 0.9,
            scale: 1
          })

          websocketService.sendFrame({
            type: 'dinov3',
            frame: dinov3Frame,
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          })
        }
      } catch (error) {
        console.error('Frame capture error:', error)
      }
    }, 16) // Run at ~60Hz, throttlers will control actual capture rate
  }, [isStreaming])

  const stopStreaming = useCallback(() => {
    setIsStreaming(false)

    // Clear interval
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
      streamIntervalRef.current = null
    }

    // Stop compositor
    if (compositorRef.current) {
      compositorRef.current.stop()
      compositorRef.current = null
    }

    // Reset throttlers
    frameThrottlerRef.current.reset()
    samThrottlerRef.current.reset()

    // Clear overlay
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    }

    setSegmentationData(null)
    setDinov3Results(null)
  }, [])


  // Set video stream
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(err => console.error('Play error:', err))
    }
  }, [stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStreaming()
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      websocketService.disconnect()
    }
  }, [])

  return (
    <div className="w-full h-full bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="flex-1 relative bg-gray-900">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <p className="text-white">{error}</p>
            <button onClick={startCamera} className="px-6 py-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-400 text-black rounded-full hover:from-gray-50 hover:to-gray-100 cursor-pointer font-medium shadow-sm">
              Enable Camera
            </button>
          </div>
        ) : isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white">Loading camera...</p>
          </div>
        ) : stream ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {showOverlay && (
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}
            {compositeCanvasRef.current && (
              <canvas
                ref={compositeCanvasRef}
                className="hidden"
              />
            )}

            {/* Uploaded Image Overlay */}
            {uploadedImage && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                <div className="relative max-w-full max-h-full p-4">
                  <img
                    src={uploadedImage.previewUrl}
                    alt="Uploaded"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                  <button
                    onClick={onClearImage}
                    className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                    title="Remove image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-6 left-6 bg-black/75 text-white px-4 py-2 rounded-lg">
                    <p className="text-sm font-medium">Image ready for voice chat</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {uploadedImage ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                  src={uploadedImage.previewUrl}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
                <button
                  onClick={onClearImage}
                  className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                  title="Remove image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-6 left-6 bg-black/75 text-white px-4 py-2 rounded-lg">
                  <p className="text-sm font-medium">Image ready for voice chat</p>
                </div>
              </div>
            ) : (
              <button onClick={startCamera} className="px-8 py-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-400 text-black rounded-full hover:from-gray-50 hover:to-gray-100 cursor-pointer font-medium text-lg shadow-sm">
                Start Camera
              </button>
            )}
          </div>
        )}

        {/* Streaming status indicator */}
        {isStreaming && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white text-sm">
              Streaming • {connectionStatus}
            </span>
          </div>
        )}

        {/* Dinov3 results display */}
        {dinov3Results && (
          <div className="absolute bottom-4 left-4 bg-black/75 text-white p-3 rounded-lg max-w-xs">
            <p className="text-xs font-semibold mb-1">Dinov3 Analysis</p>
            <p className="text-xs">{JSON.stringify(dinov3Results, null, 2)}</p>
          </div>
        )}
      </div>

      {stream && (
        <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Live</span>
            </div>

            {isStreaming && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showOverlay}
                  onChange={(e) => setShowOverlay(e.target.checked)}
                  className="rounded"
                />
                Show Segmentation
              </label>
            )}
          </div>

          <div>
            {!isStreaming ? (
              <button
                onClick={startStreaming}
                className="px-4 py-2 text-sm bg-blue-500 border-2 border-blue-600 text-white rounded-full hover:bg-blue-600 cursor-pointer font-medium shadow-sm"
              >
                Start Streaming
              </button>
            ) : (
              <button
                onClick={stopStreaming}
                className="px-4 py-2 text-sm bg-gray-500 border-2 border-gray-600 text-white rounded-full hover:bg-gray-600 cursor-pointer font-medium shadow-sm"
              >
                Stop Streaming
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoInput
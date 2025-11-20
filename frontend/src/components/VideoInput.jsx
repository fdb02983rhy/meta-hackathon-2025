import { useRef, useState, useEffect } from 'react'

const VideoInput = () => {
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState(null)

  const startCamera = async () => {
    setIsLoading(true)
    setRecordedVideo(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      })
      
      setStream(mediaStream)
      setError(null)
    } catch (err) {
      setError(`Camera error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = () => {
    if (!stream) return
    
    const chunks = []
    const recorder = new MediaRecorder(stream)
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setRecordedVideo(url)
    }
    
    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        if (videoRef.current) videoRef.current.srcObject = null
        setStream(null)
      }
    }
  }

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(err => console.error('Play error:', err))
    }
  }, [stream])

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
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : recordedVideo ? (
          <video src={recordedVideo} controls className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <button onClick={startCamera} className="px-8 py-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-400 text-black rounded-full hover:from-gray-50 hover:to-gray-100 cursor-pointer font-medium text-lg shadow-sm">
              Start Camera
            </button>
          </div>
        )}
      </div>

      {stream && (
        <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-sm font-medium">{isRecording ? 'Recording' : 'Live'}</span>
          </div>
          <div className="flex gap-2">
            {!isRecording ? (
              <button onClick={startRecording} className="px-4 py-2 text-sm bg-gradient-to-r from-white to-gray-50 border-2 border-gray-400 text-black rounded-full hover:from-gray-50 hover:to-gray-100 cursor-pointer font-medium shadow-sm">
                Record
              </button>
            ) : (
              <button onClick={stopRecording} className="px-4 py-2 text-sm bg-red-500 border-2 border-red-600 text-white rounded-full hover:bg-red-600 cursor-pointer font-medium shadow-sm">
                Stop & Save
              </button>
            )}
          </div>
        </div>
      )}
      
      {recordedVideo && (
        <div className="p-3 bg-white border-t border-gray-200">
          <button onClick={startCamera} className="w-full py-2 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-400 text-black rounded-full hover:from-gray-50 hover:to-gray-100 cursor-pointer font-medium shadow-sm">
            Record New Video
          </button>
        </div>
      )}
    </div>
  )
}

export default VideoInput

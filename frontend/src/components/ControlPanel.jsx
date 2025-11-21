import { useRef, useState } from 'react'

const ControlPanel = ({ onSessionIdReceived, onVoiceMessage, uploadedImage, onImageUpload }) => {
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error
  const [uploadMessage, setUploadMessage] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)

      // Only accept PDF files
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setUploadStatus('error')
        setUploadMessage('Please upload a PDF file')
        return
      }

      // Automatically upload the file
      await uploadFile(selectedFile)
    }
  }

  const uploadFile = async (fileToUpload) => {
    setUploadStatus('uploading')
    setUploadMessage('Processing PDF manual...')

    const formData = new FormData()
    formData.append('file', fileToUpload)

    try {
      // Use the correct endpoint for PDF to text conversion
      const response = await fetch('http://localhost:8000/api/pdf-to-text', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const data = await response.json()

      // Check if session_id was returned
      if (data.session_id) {
        setCurrentSessionId(data.session_id)
        // Pass session_id to parent component (Chat can use it)
        onSessionIdReceived?.(data.session_id)

        // Store in localStorage for persistence
        localStorage.setItem('chatSessionId', data.session_id)
        localStorage.setItem('hasManualContext', 'true')

        setUploadStatus('success')
        setUploadMessage(`Manual loaded! Session created: ${data.session_id.substring(0, 8)}...`)
      } else {
        setUploadStatus('success')
        setUploadMessage(`Successfully processed ${fileToUpload.name}`)
      }

      // Log the response for debugging
      console.log('PDF conversion response:', data)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setUploadMessage('Failed to process PDF. Please try again.')
    }
  }

  const handleImageChange = (e) => {
    const selectedImage = e.target.files?.[0]
    if (selectedImage) {
      // Validate image type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validImageTypes.includes(selectedImage.type)) {
        alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }

      // Create preview URL and store image
      const previewUrl = URL.createObjectURL(selectedImage)
      onImageUpload?.({ file: selectedImage, previewUrl })
    }
  }

  const getStatusColor = () => {
    switch(uploadStatus) {
      case 'success': return 'bg-green-50 border-green-200 text-green-700'
      case 'error': return 'bg-red-50 border-red-200 text-red-700'
      case 'uploading': return 'bg-blue-50 border-blue-200 text-blue-700'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // Collect audio data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await sendAudioToBackend(audioBlob)

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error starting recording:', err)
      alert('Failed to start recording. Please ensure microphone access is granted.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudioToBackend = async (audioBlob) => {
    setIsProcessing(true)

    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })

      // Create FormData
      const formData = new FormData()

      // Determine which endpoint to use based on image presence
      const hasImage = uploadedImage?.file
      let url

      if (hasImage) {
        // Use multimodal endpoint (no session support)
        url = 'http://localhost:8000/api/voice-chat-multimodal'
        formData.append('audio', audioFile)
        formData.append('images', uploadedImage.file)
      } else {
        // Use regular voice chat endpoint (with session support)
        url = 'http://localhost:8000/api/voice-chat'
        formData.append('file', audioFile)

        // Add session_id if available
        if (currentSessionId) {
          url += `?session_id=${encodeURIComponent(currentSessionId)}`
        }
      }

      // Send to backend for voice chat (transcription + AI response)
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Pass the voice message data to parent component
      if (onVoiceMessage) {
        onVoiceMessage(data)
      }
    } catch (err) {
      console.error('Error sending audio to backend:', err)
      alert('Failed to process voice message. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVoiceButtonPress = () => {
    if (!isProcessing) {
      startRecording()
    }
  }

  const handleVoiceButtonRelease = () => {
    if (isRecording) {
      stopRecording()
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-center mb-4">Control Panel</h2>
      <div className="flex flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 px-6 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-400 text-black rounded-full hover:from-gray-50 hover:to-gray-100 cursor-pointer font-medium shadow-sm transition-all"
          disabled={uploadStatus === 'uploading'}
        >
          {uploadStatus === 'uploading' ? 'Processing Manual...' : 'Upload PDF Manual'}
        </button>

        <button
          onClick={() => imageInputRef.current?.click()}
          className={`w-full py-3 px-6 rounded-full font-medium shadow-sm transition-all ${
            uploadedImage
              ? 'bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-700 text-white hover:from-green-600 hover:to-green-700'
              : 'bg-gradient-to-r from-purple-500 to-purple-600 border-2 border-purple-700 text-white hover:from-purple-600 hover:to-purple-700'
          } cursor-pointer`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <span>{uploadedImage ? 'Image Uploaded ✓' : 'Upload Image'}</span>
          </div>
        </button>

        {/* Voice Recording Button */}
        <button
          onMouseDown={handleVoiceButtonPress}
          onMouseUp={handleVoiceButtonRelease}
          onMouseLeave={handleVoiceButtonRelease}
          onTouchStart={handleVoiceButtonPress}
          onTouchEnd={handleVoiceButtonRelease}
          disabled={isProcessing}
          className={`w-full py-3 px-6 rounded-full font-medium shadow-sm transition-all select-none ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse border-2 border-red-600'
              : isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-400'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 cursor-pointer border-2 border-blue-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isRecording ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span>Recording... Release to Send</span>
              </>
            ) : isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                <span>Press & Hold to Talk</span>
              </>
            )}
          </div>
        </button>
      </div>

      {file && (
        <div className={`mt-4 p-3 rounded-xl border ${getStatusColor()}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs opacity-75 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {uploadStatus === 'uploading' && (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
            )}
            {uploadStatus === 'success' && (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            {uploadStatus === 'error' && (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
          </div>
          {uploadMessage && (
            <p className="text-xs mt-2">{uploadMessage}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default ControlPanel

import { useState, useRef, useEffect } from 'react'

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessageToChat = async (message) => {
    // Add user message to chat
    setMessages(prev => [...prev, { text: message, sender: 'user' }])
    setIsLoadingResponse(true)
    setError('')

    try {
      // Send to chat API
      const response = await fetch(`http://localhost:8000/api/chat?message=${encodeURIComponent(message)}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Add AI response to chat
      setMessages(prev => [...prev, { text: data.response, sender: 'ai' }])
    } catch (err) {
      console.error('Error sending message to chat:', err)
      setError('Failed to get AI response. Please try again.')
      setMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', sender: 'ai' }])
    } finally {
      setIsLoadingResponse(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const message = input
    setInput('')
    await sendMessageToChat(message)
  }

  const startRecording = async () => {
    try {
      setError('')

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
      setError('Failed to start recording. Please ensure microphone access is granted.')
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
    setError('')

    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })

      // Create FormData
      const formData = new FormData()
      formData.append('file', audioFile)

      // Send to backend for transcription
      const response = await fetch('http://localhost:8000/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Put transcribed text in the input field (don't send automatically)
      if (data.transcription) {
        setInput(data.transcription)
      }
    } catch (err) {
      console.error('Error sending audio to backend:', err)
      setError('Failed to transcribe audio. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleVoiceInput = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {error && (
        <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-8">Start a conversation...</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-[#0866FF] text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}

            {/* Show loading indicator for AI response */}
            {isLoadingResponse && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="mt-3">
        {/* Show transcribing indicator */}
        {isProcessing && (
          <div className="mb-2 flex items-center justify-center">
            <span className="text-sm text-gray-600 italic">Transcribing audio...</span>
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isProcessing ? "Transcribing..." : "Ask a question..."}
            disabled={isProcessing || isLoadingResponse}
            className="w-full pl-4 pr-24 py-3 text-sm border-2 border-gray-400 rounded-full focus:outline-none focus:border-gray-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={toggleVoiceInput}
              disabled={isProcessing || isLoadingResponse}
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                  : isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? (
                // Stop icon (square)
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              ) : (
                // Microphone icon
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing || isLoadingResponse}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center cursor-pointer hover:from-gray-700 hover:to-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
        {isRecording && (
          <div className="mt-2 flex items-center justify-center">
            <span className="flex items-center text-red-500 text-sm font-medium">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
              Recording... Click stop to finish
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
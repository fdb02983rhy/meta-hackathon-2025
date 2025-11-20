import { useState, useRef, useEffect } from "react"

const Details = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const chatboxRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight
    }
  }, [messages])

  const sendMessageToChat = async (message) => {
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: message }])
    setIsLoadingResponse(true)
    setError("")

    try {
      // Send to chat API
      const response = await fetch(`http://localhost:8000/api/chat?message=${encodeURIComponent(message)}`, {
        method: "POST"
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Add AI response to chat
      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
    } catch (err) {
      console.error("Error sending message to chat:", err)
      setError("Failed to get AI response. Please try again.")
    } finally {
      setIsLoadingResponse(false)
    }
  }

  const startRecording = async () => {
    try {
      setError("")

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        await sendAudioToBackend(audioBlob)

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Error starting recording:", err)
      setError(
        "Failed to start recording. Please ensure microphone access is granted."
      )
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
    setError("")

    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      })

      // Create FormData
      const formData = new FormData()
      formData.append("file", audioFile)

      // Send to backend
      const response = await fetch("http://localhost:8000/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Send transcribed text to chat
      if (data.transcription) {
        await sendMessageToChat(data.transcription)
      }
    } catch (err) {
      console.error("Error sending audio to backend:", err)
      setError("Failed to transcribe audio. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Details</h2>
        <span className="text-lg">1/6</span>
      </div>

      <div className="mb-4 flex gap-2">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "Processing..." : "🎤 Start Recording"}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors animate-pulse"
          >
            ⏹️ Stop Recording
          </button>
        )}
        {isRecording && (
          <span className="flex items-center text-red-500 font-medium">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
            Recording...
          </span>
        )}
      </div>

      <div
        id="chatbox"
        ref={chatboxRef}
        className="flex-1 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Chat messages */}
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm font-medium mb-1">
                  {message.role === "user" ? "You" : "AI Assistant"}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Show processing indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-gray-600 italic">Transcribing audio...</p>
              </div>
            </div>
          )}

          {/* Show loading indicator for AI response */}
          {isLoadingResponse && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Show placeholder if no messages */}
          {messages.length === 0 && !isProcessing && !isLoadingResponse && (
            <div className="text-center text-gray-500 mt-8">
              <p>No messages yet. Start recording to begin a conversation!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Details
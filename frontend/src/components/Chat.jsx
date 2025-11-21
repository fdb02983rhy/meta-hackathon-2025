import { useState, useRef, useEffect } from 'react'

const Chat = ({ sessionId, onSessionIdChange, voiceMessage }) => {
  const [messages, setMessages] = useState([])
  const [hasManualContext, setHasManualContext] = useState(false)
  const messagesEndRef = useRef(null)

  // Load session from localStorage on component mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatSessionId')
    const storedMessages = localStorage.getItem('chatMessages')
    const storedHasManual = localStorage.getItem('hasManualContext')

    if (storedSessionId && !sessionId) {
      onSessionIdChange?.(storedSessionId)
    }

    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages))
      } catch (err) {
        console.error('Failed to parse stored messages:', err)
      }
    }

    if (storedHasManual === 'true') {
      setHasManualContext(true)
    }
  }, [])

  // Save session and messages to localStorage when they change
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('chatSessionId', sessionId)
      setHasManualContext(true)
      localStorage.setItem('hasManualContext', 'true')
    }
  }, [sessionId])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages))
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Text-to-speech function
  const speakText = (text) => {
    if (!text) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)

      // Configure speech settings
      utterance.rate = 1.0  // Speech rate (0.1 to 10)
      utterance.pitch = 1.0  // Pitch (0 to 2)
      utterance.volume = 1.0  // Volume (0 to 1)

      // Use the default voice or you can select a specific voice
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        // Prefer a natural-sounding voice
        const preferredVoice = voices.find(voice =>
          voice.name.includes('Google') ||
          voice.name.includes('Microsoft') ||
          voice.name.includes('Natural')
        ) || voices[0]
        utterance.voice = preferredVoice
      }

      window.speechSynthesis.speak(utterance)
    } else {
      console.warn('Text-to-speech is not supported in this browser')
    }
  }

  // Handle incoming voice messages from ControlPanel
  useEffect(() => {
    if (voiceMessage) {
      // Add user transcription if available
      if (voiceMessage.transcription) {
        setMessages(prev => [...prev, { text: voiceMessage.transcription, sender: 'user' }])
      }

      // Add AI response if available and speak it
      if (voiceMessage.response) {
        setMessages(prev => [...prev, { text: voiceMessage.response, sender: 'ai' }])
        speakText(voiceMessage.response)
      }
    }
  }, [voiceMessage])

  const clearSession = () => {
    // Clear all session data
    localStorage.removeItem('chatSessionId')
    localStorage.removeItem('chatMessages')
    localStorage.removeItem('hasManualContext')
    setMessages([])
    setHasManualContext(false)
    onSessionIdChange?.(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Session status bar */}
      {(sessionId || hasManualContext) && (
        <div className="mb-2 flex items-center justify-between p-2 bg-green-50 border border-green-300 rounded text-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-medium">
              {sessionId ? 'Manual Context Active' : 'Previous Session Loaded'}
            </span>
            {sessionId && (
              <span className="text-green-600 text-xs">
                (Session: {sessionId.substring(0, 8)}...)
              </span>
            )}
          </div>
          <button
            onClick={clearSession}
            className="text-green-700 hover:text-green-900 text-xs underline"
          >
            Clear Session
          </button>
        </div>
      )}

      <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-y-auto min-h-0">
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
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
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

  // Handle incoming voice messages from ControlPanel
  useEffect(() => {
    if (voiceMessage) {
      // Add user transcription if available
      if (voiceMessage.transcription) {
        setMessages(prev => [...prev, { text: voiceMessage.transcription, sender: 'user' }])
      }

      // Add AI response if available
      if (voiceMessage.response) {
        setMessages(prev => [...prev, { text: voiceMessage.response, sender: 'ai' }])
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
    <div className="flex-1 flex flex-col">
      {/* Session status bar */}
      {(sessionId || hasManualContext) && (
        <div className="mb-2 flex items-center justify-between p-2 bg-green-50 border border-green-300 rounded text-sm">
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

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
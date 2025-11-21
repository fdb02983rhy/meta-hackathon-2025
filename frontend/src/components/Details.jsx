import Chat from './Chat'

const Details = ({ sessionId, onSessionIdChange, voiceMessage, clearHistory }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col min-h-[400px] max-h-[600px]">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold">Details</h2>
        <span className="text-lg">1/6</span>
      </div>

      <Chat
        sessionId={sessionId}
        onSessionIdChange={onSessionIdChange}
        voiceMessage={voiceMessage}
        clearHistory={clearHistory}
      />
    </div>
  )
}

export default Details
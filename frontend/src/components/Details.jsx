import Chat from './Chat'

const Details = ({ sessionId, onSessionIdChange, voiceMessage }) => {
  return (
    <div className="h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold">Details</h2>
        <span className="text-lg">1/6</span>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <Chat
          sessionId={sessionId}
          onSessionIdChange={onSessionIdChange}
          voiceMessage={voiceMessage}
        />
      </div>
    </div>
  )
}

export default Details
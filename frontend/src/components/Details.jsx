import Chat from './Chat'

const Details = ({ sessionId, onSessionIdChange, voiceMessage }) => {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Details</h2>
        <span className="text-lg">1/6</span>
      </div>

      <Chat
        sessionId={sessionId}
        onSessionIdChange={onSessionIdChange}
        voiceMessage={voiceMessage}
      />
    </div>
  )
}

export default Details
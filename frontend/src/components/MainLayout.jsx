import { useState, useEffect } from "react"
import VideoInput from "./VideoInput"
import ControlPanel from "./ControlPanel"
import Details from "./Details"
import Navbar from "./Navbar"

const MainLayout = () => {
  const [sessionId, setSessionId] = useState(null)
  const [voiceMessage, setVoiceMessage] = useState(null)
  const [shouldClearHistory, setShouldClearHistory] = useState(true)
  const [uploadedImage, setUploadedImage] = useState(null)

  // Clean all conversation history on page load
  useEffect(() => {
    localStorage.removeItem('chatSessionId')
    localStorage.removeItem('chatMessages')
    localStorage.removeItem('hasManualContext')
    // Signal that cleanup is complete
    setShouldClearHistory(false)
  }, [])

  const handleSessionIdReceived = (newSessionId) => {
    setSessionId(newSessionId)
    console.log('Session ID received in MainLayout:', newSessionId)
  }

  const handleVoiceMessage = (messageData) => {
    setVoiceMessage(messageData)
    console.log('Voice message received in MainLayout:', messageData)
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 p-4 overflow-hidden">
        <div className="flex gap-4 sm:gap-6 h-full w-full flex-col lg:flex-row">
          <div className="flex-1 min-h-[300px] lg:min-h-0">
            <VideoInput uploadedImage={uploadedImage} onClearImage={() => setUploadedImage(null)} />
          </div>

          <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4 overflow-y-auto min-h-0">
            <ControlPanel
              onSessionIdReceived={handleSessionIdReceived}
              onVoiceMessage={handleVoiceMessage}
              uploadedImage={uploadedImage}
              onImageUpload={setUploadedImage}
            />
            <Details
              sessionId={sessionId}
              onSessionIdChange={setSessionId}
              voiceMessage={voiceMessage}
              clearHistory={shouldClearHistory}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainLayout

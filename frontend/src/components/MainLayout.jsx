import VideoInput from "./VideoInput"
import ControlPanel from "./ControlPanel"
import Details from "./Details"

const MainLayout = () => {
  return (
    <div className="w-screen h-screen p-4">
      <div className="flex gap-6 h-full w-full">
        <div className="flex-1">
          <VideoInput />
        </div>

        <div className="w-96 flex flex-col gap-6">
          <ControlPanel />
          <Details />
        </div>
      </div>
    </div>
  )
}

export default MainLayout

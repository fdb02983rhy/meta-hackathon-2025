import VideoInput from "./VideoInput"
import ControlPanel from "./ControlPanel"
import Details from "./Details"
import Navbar from "./Navbar"

const MainLayout = () => {
  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-1 p-4 overflow-hidden">
        <div className="flex gap-4 sm:gap-6 h-full w-full flex-col lg:flex-row">
          <div className="flex-1 min-h-[300px] lg:min-h-0">
            <VideoInput />
          </div>

          <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4">
            <ControlPanel />
            <Details />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainLayout

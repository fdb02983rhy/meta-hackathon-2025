const ControlPanel = () => {
  return (
    <div className="bg-white rounded-2xl border-4 border-black p-6">
      <h2 className="text-xl font-semibold text-center mb-4">Control Panel</h2>
      <div className="flex flex-col gap-4">
        <button className="w-full py-3 px-4 bg-white border-3 border-black rounded-xl hover:bg-gray-50 transition-colors">
          Document upload
        </button>
        <button className="w-full py-3 px-4 bg-white border-3 border-black rounded-xl hover:bg-gray-50 transition-colors">
          Begin
        </button>
      </div>
    </div>
  )
}

export default ControlPanel
const Navbar = () => {
  return (
    <nav className="bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 shadow-md">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0866FF] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="font-semibold text-lg text-gray-800">Llama Assembly</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Demo</span>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

const Details = () => {
  return (
    <div className="flex-1 bg-white rounded-2xl border-4 border-black p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Details</h2>
        <span className="text-lg">1/6</span>
      </div>

      <div className="flex-1 bg-white rounded-xl border-3 border-black p-4">
        <p className="text-gray-600">chat text</p>
      </div>
    </div>
  )
}

export default Details
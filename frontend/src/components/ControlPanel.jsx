import { useRef, useState } from 'react'

const ControlPanel = () => {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) setFile(selectedFile)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-center mb-4">Control Panel</h2>   
      <div className="flex flex-col gap-3">
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleFileChange} className="hidden" />    
        <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 px-6 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-400 text-black rounded-full hover:from-gray-50 hover:to-gray-100 cursor-pointer font-medium shadow-sm">
          Document upload
        </button>
        <button className="w-full py-3 px-6 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-400 text-black rounded-full hover:from-gray-50 hover:to-gray-100 cursor-pointer font-medium shadow-sm">
          Begin
        </button>
      </div>

      {file && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      )}
    </div>
  )
}

export default ControlPanel

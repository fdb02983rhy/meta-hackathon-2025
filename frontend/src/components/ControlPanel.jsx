import { useRef, useState } from 'react'

const ControlPanel = ({ onSessionIdReceived }) => {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error
  const [uploadMessage, setUploadMessage] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState(null)

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)

      // Only accept PDF files
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setUploadStatus('error')
        setUploadMessage('Please upload a PDF file')
        return
      }

      // Automatically upload the file
      await uploadFile(selectedFile)
    }
  }

  const uploadFile = async (fileToUpload) => {
    setUploadStatus('uploading')
    setUploadMessage('Processing PDF manual...')

    const formData = new FormData()
    formData.append('file', fileToUpload)

    try {
      // Use the correct endpoint for PDF to text conversion
      const response = await fetch('http://localhost:8000/api/pdf-to-text', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const data = await response.json()

      // Check if session_id was returned
      if (data.session_id) {
        setCurrentSessionId(data.session_id)
        // Pass session_id to parent component (Chat can use it)
        onSessionIdReceived?.(data.session_id)

        // Store in localStorage for persistence
        localStorage.setItem('chatSessionId', data.session_id)
        localStorage.setItem('hasManualContext', 'true')

        setUploadStatus('success')
        setUploadMessage(`Manual loaded! Session created: ${data.session_id.substring(0, 8)}...`)
      } else {
        setUploadStatus('success')
        setUploadMessage(`Successfully processed ${fileToUpload.name}`)
      }

      // Log the response for debugging
      console.log('PDF conversion response:', data)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setUploadMessage('Failed to process PDF. Please try again.')
    }
  }

  const getStatusColor = () => {
    switch(uploadStatus) {
      case 'success': return 'bg-green-50 border-green-200 text-green-700'
      case 'error': return 'bg-red-50 border-red-200 text-red-700'
      case 'uploading': return 'bg-blue-50 border-blue-200 text-blue-700'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-center mb-4">Control Panel</h2>
      <div className="flex flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 px-6 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-400 text-black rounded-full hover:from-gray-50 hover:to-gray-100 cursor-pointer font-medium shadow-sm transition-all"
          disabled={uploadStatus === 'uploading'}
        >
          {uploadStatus === 'uploading' ? 'Processing Manual...' : 'Upload PDF Manual'}
        </button>
      </div>

      {file && (
        <div className={`mt-4 p-3 rounded-xl border ${getStatusColor()}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs opacity-75 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {uploadStatus === 'uploading' && (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
            )}
            {uploadStatus === 'success' && (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            {uploadStatus === 'error' && (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
          </div>
          {uploadMessage && (
            <p className="text-xs mt-2">{uploadMessage}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default ControlPanel

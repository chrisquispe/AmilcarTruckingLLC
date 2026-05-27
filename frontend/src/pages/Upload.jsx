import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPdf } from '../api/client'

export default function Upload() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const handleFile = (f) => {
    if (!f || !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file.')
      return
    }
    setError(null)
    setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const res = await uploadPdf(file)
      navigate(`/reports/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Upload failed. Is the backend running?')
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <p className="text-sm text-slate-500 mb-6">
        Upload a TRUX remittance PDF. The system will automatically extract ticket data by truck.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <p className="text-4xl mb-3">📄</p>
        {file ? (
          <p className="font-medium text-slate-700">{file.name}</p>
        ) : (
          <>
            <p className="font-medium text-slate-700">Drop your PDF here</p>
            <p className="text-sm text-slate-400 mt-1">or click to browse</p>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        className="mt-6 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? 'Uploading & Parsing...' : 'Upload & Parse PDF'}
      </button>
    </div>
  )
}

"use client"
import { useState } from 'react'
import Image from 'next/image'
import { MdKeyboardDoubleArrowRight } from "react-icons/md";

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']

const isValidImageType = (file) => {
  if (!file) return false
  return VALID_IMAGE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
}

export default function CheckImage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      if (!isValidImageType(file)) {
        setMessage('Please select a valid image file (.jpg, .jpeg, .png, .bmp, .tiff, .webp)')
        setSelectedFile(null)
        setPreviewUrl(null)
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setMessage('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedFile) return

    setLoading(true)
    setMessage('')
    setMatches([])

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/check-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setMessage(data.message)
      if (data.matches) {
        setMatches(data.matches)
      }
    } catch (error) {
      setMessage('Error processing image')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-dvh bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: 'url("/bg.jpg")' }}>
      <div className="mx-auto p-4 relative h-full">
        <div className={`flex flex-col h-full justify-center md:flex-row gap-8 transition-all duration-500 ease-in-out ${previewUrl ? 'justify-between' : 'justify-center'}`}>
          <div className={`flex flex-col items-center justify-center transition-all duration-500 ease-in-out h-full`}>
            {previewUrl && (
              <div className="mb-2 opacity-0 animate-fade-in">
                <div className="aspect-square relative w-full overflow-hidden rounded-lg shadow-md">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    height={90}
                    width={350}
                    className="hover:scale-105 transition-transform duration-300"
                    priority
                  />
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
              <div className="relative">
                <input
                  type="file"
                  accept={VALID_IMAGE_EXTENSIONS.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-blue-500 transition-colors duration-300"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Upload file here'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {VALID_IMAGE_EXTENSIONS.join(', ')} files supported
                    </p>
                  </div>
                </label>
              </div>
              {selectedFile && (
                <button
                  type="submit"
                  disabled={!selectedFile || loading}
                  className="w-full bg-blue-500 hover:scale-95 text-white px-4 py-2 rounded disabled:bg-gray-300 transition-colors duration-300"
                >
                  {loading ? 'Processing...' : 'Upload and Check'}
                </button>
              )}
            </form>
          </div>
          {matches.length > 0 && (
            <div className={`flex flex-col gap-2 justify-center h-full items-center p-4 opacity-0 animate-slide-in-l-hold`}>
              <MdKeyboardDoubleArrowRight size={70} color='white' className='bg-gray-500/50 rounded-md'/>
            </div>
          )}

          {message && (
            <div className={`bottom-0 left-0 flex p-4 ${message === "Matching faces found" ? "bg-green-100 border-green-400 border" : "bg-red-200 border-red-400 border"} absolute opacity-0 animate-slide-in-l`}>
              <p className={`${message === "Matching faces found" ? "text-green-500" : "text-red-500"}`}>{message}</p>
            </div>
          )}
          {matches.length > 0 && (
            <div className="w-full overflow-auto bg-gray-500/50 rounded-md p-6 md:w-1/2 opacity-0 animate-slide-in">
              <h2 className='text-white font-extrabold text-center mb-4 text-2xl'>Matching images</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {matches.map((match, index) => (
                  <div key={index} className="aspect-square relative w-full overflow-hidden rounded-lg shadow-md">
                    <Image
                      src={`data:image/jpeg;base64,${match}`}
                      alt={`Match ${index + 1}`}
                      fill
                      style={{ objectFit: 'contain' }}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="hover:scale-105 transition-transform duration-300"
                      priority={index < 3}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
"use client"
import { useState } from 'react'
import Image from 'next/image'
import { IoClose } from "react-icons/io5";
import axios from 'axios'

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']

const isValidImageType = (file) => {
  if (!file) return false
  return VALID_IMAGE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
}

export default function Upload() {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadResults, setUploadResults] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [fileProgress, setFileProgress] = useState({})

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    const validFiles = files.filter(isValidImageType)

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only image files are allowed.')
    }

    setSelectedFiles(validFiles)
    const urls = validFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (selectedFiles.length === 0) return

    setLoading(true)
    setUploadResults(null)
    setShowResults(false)
    setFileProgress({})

    const formData = new FormData()
    selectedFiles.forEach((file) => {
      formData.append('files', file)
      setFileProgress(prev => ({
        ...prev,
        [file.name]: 0
      }))
    })
    formData.append('workers', '4')

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            selectedFiles.forEach(file => {
              setFileProgress(prev => ({
                ...prev,
                [file.name]: percentCompleted
              }))
            })
          }
        }
      )

      setUploadResults(response.data)
      setShowResults(true)
    } catch (error) {
      console.error('Error:', error)
      alert('Error uploading files')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Multiple Images</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <input
              type="file"
              accept={VALID_IMAGE_EXTENSIONS.join(',')}
              onChange={handleFileSelect}
              multiple
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
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} files selected`
                    : 'Click to upload or drag and drop'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {VALID_IMAGE_EXTENSIONS.join(', ')} files supported
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={selectedFiles.length === 0 || loading}
            className="w-full mb-6 bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors duration-300"
          >
            {loading ? 'Uploading...' : 'Upload Images'}
          </button>

          {previewUrls.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="text-lg font-semibold mb-3">Selected Files ({selectedFiles.length})</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">{index + 1}.</span>
                      <span className="text-gray-800">{file.name}</span>
                    </div>
                    {loading && (
                      <div className="w-32">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fileProgress[file.name] || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {showResults && uploadResults && (
          <div className="fixed bottom-0 left-0 flex p-4 bg-green-100 border-green-400 border w-full justify-between items-center">
            <p className="text-green-500">Uploaded Success!</p>
            <button
              onClick={() => setShowResults(false)}
              className="text-green-500 hover:text-green-600 transition-colors duration-300"
            >
              <IoClose size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

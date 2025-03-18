"use client"
import { useState } from 'react'
import Image from 'next/image'
import { FaDownload, FaCheck, FaTimes } from 'react-icons/fa'
import MatchingImages from './MatchingImages'
import { LuScanFace } from "react-icons/lu";

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']

const isValidImageType = (file) => {
    if (!file) return false
    return VALID_IMAGE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
}

export default function CheckImage() {
    const [uploadResults, setUploadResults] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [selectedFile, setSelectedFile] = useState(null)
    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [previewUrl, setPreviewUrl] = useState(null)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [showTermsModal, setShowTermsModal] = useState(false)
    const [selectedImages, setSelectedImages] = useState([])
    const [showMatches, setShowMatches] = useState(false)

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
        setMessage('Connecting to API...')
        setMatches([])
        setUploadProgress(0)
        setUploadResults(null)
        setSelectedImages([])

        // ตรวจสอบค่า API URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiUrl) {
            setMessage('API URL is not configured.')
            setLoading(false)
            return
        }
        console.log("Connecting to API:", apiUrl)

        const formData = new FormData()
        formData.append('file', selectedFile)
        // ส่ง tolerance ตามที่ API backend กำหนด (อาจมีการตั้ง default เป็น 0.6)
        formData.append('tolerance', '0.6')

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 90000)

            const response = await fetch(`${apiUrl}/search/`, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                signal: controller.signal,
                body: formData,
            })

            clearTimeout(timeoutId)
            console.log("Response status:", response.status)

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const contentType = response.headers.get("content-type")
            console.log("Content-Type:", contentType)

            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Unexpected content type: ' + (contentType || 'none'))
            }

            const data = await response.json()
            console.log("API response data:", data)

            let processedMatches = []
            if (data.results && Array.isArray(data.results)) {
                console.log(`Found ${data.results.length} matches in new format`)
                processedMatches = data.results.map((match, index) => ({
                    id: match.face_id || `match-${index}`,
                    confidence: match.confidence || 0,
                    image_url: match.image_url || null,
                    // เก็บ key ที่เป็นชื่อ object ของ Minio ไว้ใน image_url field หรือ field แยกต่างหากถ้าต้องการ
                    image_path: match.image_url ? match.image_url.split('/').pop() : null,
                    face_location: match.face_location || null,
                    metadata: match.metadata || {}
                }))
            } else if (data.matched_images && Array.isArray(data.matched_images)) {
                console.log(`Found ${data.matched_images.length} matches in old format`)
                processedMatches = data.matched_images.map((match, index) => ({
                    id: match.id || `match-${index}`,
                    confidence: match.confidence || 0,
                    image_url: match.image_url || match.url || null,
                    image_path: match.image_url ? match.image_url.split('/').pop() : null,
                    base64: match.base64 || null,
                }))
            } else {
                setMessage('No matching images or invalid response format')
                return
            }

            // กรองผลลัพธ์ให้เหลือเฉพาะ match ที่ confidence มากกว่า 60%
            processedMatches = processedMatches.filter(match => match.confidence > 60 && match.image_url)

            setMatches(processedMatches)
            setShowMatches(true)
            setMessage(`Found ${processedMatches.length} matching images`)
        } catch (error) {
            console.error('Error:', error)
            setMessage(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        // <div className="h-lvh bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/korat-night-bg.jpg")' }}>
        <div className="h-lvh bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/green-bg.jpeg")' }}>

            <div className="mx-auto p-4 relative h-full">
                <div className={`flex flex-col h-full justify-center md:flex-row gap-8 transition-all duration-500 ease-in-out ${previewUrl ? 'justify-between' : 'justify-center'}`}>
                    <div className="flex flex-col items-center justify-center transition-all duration-500 ease-in-out h-full border-white border-4 shadow-xl drop-shadow-md bg-gray-900 rounded-2xl p-6 px-16">
                        {/* <div className="flex flex-col mb-8">
              <Image
                src="/korat-night.png"
                alt="Korat Night Logo"
                width={200}
                height={100}
                className="mb-4"
                priority
              />
            </div> */}
                        <div className="flex flex-col mb-8">
                            <LuScanFace size={150} className='text-gray-400' />
                        </div>
                        {previewUrl && (
                            <div className="flex flex-col mb-2">
                                <div className="relative rounded-lg shadow-md group">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        width={350}
                                        height={350}
                                        className="rounded-2xl"
                                        priority
                                    />
                                    <button
                                        onClick={() => {
                                            setSelectedFile(null)
                                            setPreviewUrl(null)
                                            setMatches([])
                                            setMessage('')
                                        }}
                                        className="absolute -top-2 -right-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-2 shadow-lg"
                                        type="button"
                                    >
                                        <FaTimes size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
                            {!selectedFile ? (
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
                                                อัพโหลดรูปภาพใบหน้าที่นี่
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {VALID_IMAGE_EXTENSIONS.join(', ')} files supported
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!agreedToTerms || loading}
                                    className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 transition-colors duration-300"
                                >
                                    {loading ? 'Processing...' : 'Upload and Check'}
                                </button>
                            )}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="agree-terms"
                                    checked={agreedToTerms}
                                    onChange={() => setAgreedToTerms(!agreedToTerms)}
                                    className="mr-2"
                                />
                                <label htmlFor="agree-terms" className="text-sm text-white">
                                    I have read and agree to the <span className="text-blue-500 cursor-pointer" onClick={() => setShowTermsModal(true)}>Terms of Use for Facial Recognition</span>
                                </label>
                            </div>
                        </form>
                        {showTermsModal && (
                            <div className="fixed bottom-0 bg-transparent bg-opacity-75 flex items-center justify-center z-50 h-full w-full">
                                <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold">Terms of Use for Facial Recognition</h2>
                                        <button
                                            onClick={() => setShowTermsModal(false)}
                                            className="w-6 h-6 bg-gray-500 border rounded-full text-white hover:text-gray-700 flex items-center justify-center hover:bg-gray-100"
                                        >
                                            X
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-700 overflow-y-auto max-h-96">
                                        {/* Terms content */}
                                        <p>[Terms content here...]</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {matches.length > 0 && showMatches && (
                        <MatchingImages
                            matches={matches}
                            onClose={() => setShowMatches(false)}
                        />
                    )}

                    {message && (
                        <div className={`bottom-0 left-0 flex p-4 ${message.includes("Matching") || message.includes("Successfully") ? "bg-green-100 border-green-400 border" : "bg-red-200 border-red-400 border"} absolute opacity-0 animate-slide-in-l`}>
                            <p className={`${message.includes("Matching") || message.includes("Successfully") ? "text-green-500" : "text-red-500"}`}>
                                {message.includes("Error processing image") ? "Please try again..." : message}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

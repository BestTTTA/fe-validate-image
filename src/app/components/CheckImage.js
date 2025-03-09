"use client"
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { FaDownload, FaCheck, FaTimes } from "react-icons/fa";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import MatchingImages from './MatchingImages'

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
    const [viewImageModal, setViewImageModal] = useState(null)
    const [downloadingZip, setDownloadingZip] = useState(false)
    const [showMatches, setShowMatches] = useState(false)
    
    // Load required libraries
    useEffect(() => {
        // This would load the JSZip and FileSaver libraries in a real implementation
        // We're assuming they're already loaded via import
    }, []);

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
        setUploadProgress(0)
        setUploadResults(null)
        setSelectedImages([])

        const formData = new FormData()
        formData.append('file', selectedFile)

        try {
            const response = await fetch('/api/check-image', {
                method: 'POST',
                body: formData,
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    )
                    setUploadProgress(progress)
                },
            })

            const data = await response.json()
            setMessage(data.message)
            if (data.matches) {
                setMatches(data.matches)
                setShowMatches(true)  // Show matching images page
            }
            if (data.uploadResults) {
                setUploadResults(data.uploadResults)
            }
        } catch (error) {
            setMessage('Error processing image')
            console.error('Error:', error)
        } finally {
            setLoading(false)
            setUploadProgress(0)
        }
    }

    // Toggle select image for download
    const toggleSelectImage = (index) => {
        if (selectedImages.includes(index)) {
            setSelectedImages(selectedImages.filter(i => i !== index))
        } else {
            setSelectedImages([...selectedImages, index])
        }
    }

    // Select all images
    const selectAllImages = () => {
        if (selectedImages.length === matches.length) {
            setSelectedImages([])
        } else {
            setSelectedImages([...Array(matches.length).keys()])
        }
    }

    // Download a single image
    const downloadImage = (base64Data, index) => {
        const link = document.createElement('a')
        link.href = `data:image/jpeg;base64,${base64Data}`
        link.download = `match-${index + 1}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Download selected images as zip
    const downloadSelectedImages = async () => {
        const imagesToDownload = selectedImages.length > 0 ? selectedImages : [...Array(matches.length).keys()]
        
        if (imagesToDownload.length === 1) {
            // Download single image directly
            downloadImage(matches[imagesToDownload[0]], imagesToDownload[0])
        } else {
            // Create zip for multiple images
            try {
                setDownloadingZip(true)
                const zip = new JSZip();
                
                // Add each selected image to the zip
                imagesToDownload.forEach((index) => {
                    const base64Data = matches[index];
                    // Convert base64 to binary
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    // Add file to zip
                    zip.file(`match-${index + 1}.jpg`, bytes.buffer, {binary: true});
                });
                
                // Generate the zip file
                const content = await zip.generateAsync({type: 'blob'});
                
                // Save the zip file
                saveAs(content, 'matches.zip');
                
                setMessage(`Successfully downloaded ${imagesToDownload.length} images as a zip file`);
            } catch (error) {
                console.error('Error creating zip file:', error);
                setMessage('Error creating zip file for download');
            } finally {
                setDownloadingZip(false);
            }
        }
    }

    // Open image in modal view
    const openImageModal = (index) => {
        setViewImageModal(index)
    }

    return (
        <div className="h-lvh bg-cover bg-center bg-no-repeat relative bg-gray-900">
            <div className="mx-auto p-4 relative h-full">
                <div className={`flex flex-col h-full justify-center md:flex-row gap-8 transition-all duration-500 ease-in-out ${previewUrl ? 'justify-between' : 'justify-center'}`}>
                    <div className={`flex flex-col items-center justify-center transition-all duration-500 ease-in-out h-full border shadow-xl bg-gray-700 rounded-2xl p-6 px-16`}>
                    <h1 className="text-3xl font-bold text-center text-white mb-8">ค้นหารูปของคุณ</h1>
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
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                            setMatches([]);
                                            setMessage('');
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
                                                Upload your image here
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
                    </div>


                    {matches.length > 0 && showMatches && (
                        <MatchingImages 
                            matches={matches} 
                            onClose={() => setShowMatches(false)} 
                        />
                    )}

                    {message && (
                        <div className={`bottom-0 left-0 flex p-4 ${message.includes("Matching") || message.includes("Successfully") ? "bg-green-100 border-green-400 border" : "bg-red-200 border-red-400 border"} absolute opacity-0 animate-slide-in-l`}>
                            <p className={`${message.includes("Matching") || message.includes("Successfully") ? "text-green-500" : "text-red-500"}`}>{message}</p>
                        </div>
                    )}
                
                </div>
            </div>

        </div>
    )
}
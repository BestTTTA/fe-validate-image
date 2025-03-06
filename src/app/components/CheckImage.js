"use client"
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { FaDownload, FaCheck, FaTimes } from "react-icons/fa";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
        <div className="h-dvh bg-cover bg-center bg-no-repeat relative bg-gray-100/50">
            <div className="mx-auto p-4 relative h-full">
                <div className={`flex flex-col h-full justify-center md:flex-row gap-8 transition-all duration-500 ease-in-out ${previewUrl ? 'justify-between' : 'justify-center'}`}>
                    <div className={`flex flex-col items-center justify-center transition-all duration-500 ease-in-out h-full border shadow-xl bg-gray-700 rounded-2xl p-6 px-16`}>
                        {previewUrl && (
                            <div className="flex mb-2">
                                <div className="relative rounded-lg shadow-md">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        width={350}
                                        height={350}
                                        className="rounded-2xl"
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
                            
                            {selectedFile && (
                                <button
                                    type="submit"
                                    disabled={!agreedToTerms || loading}
                                    className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 transition-colors duration-300"
                                >
                                    {loading ? 'Processing...' : 'Upload and Check'}
                                </button>
                            )}
                        </form>
                    </div>
                    {matches.length > 0 && (
                        <div className={`flex flex-col gap-2 justify-center h-full items-center p-4 opacity-0 animate-slide-in-l-hold`}>
                            <MdKeyboardDoubleArrowRight size={70} color='white' className='bg-gray-500/20 rounded-md' />
                        </div>
                    )}

                    {message && (
                        <div className={`bottom-0 left-0 flex p-4 ${message.includes("Matching") || message.includes("Successfully") ? "bg-green-100 border-green-400 border" : "bg-red-200 border-red-400 border"} absolute opacity-0 animate-slide-in-l`}>
                            <p className={`${message.includes("Matching") || message.includes("Successfully") ? "text-green-500" : "text-red-500"}`}>{message}</p>
                        </div>
                    )}

                    {matches.length > 0 && (
                        <div className="w-full overflow-auto p-4 bg-gray-500/50 rounded-md md:w-1/2 opacity-0 animate-slide-in">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className='text-white font-extrabold text-center text-2xl'>Matching images</h2>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={selectAllImages}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                                    >
                                        {selectedImages.length === matches.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <button 
                                        onClick={downloadSelectedImages}
                                        disabled={matches.length === 0 || downloadingZip}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 disabled:bg-gray-400"
                                    >
                                        <FaDownload className="mr-1" /> 
                                        {downloadingZip ? 'Creating Zip...' : selectedImages.length > 0 
                                            ? `Download (${selectedImages.length})` 
                                            : 'Download All'}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {matches.map((match, index) => (
                                    <div key={index} className="relative group">
                                        <div className="aspect-square relative w-full overflow-hidden">
                                            <div 
                                                className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full ${
                                                    selectedImages.includes(index) 
                                                        ? 'bg-blue-500 text-white' 
                                                        : 'bg-white border border-gray-300'
                                                } flex items-center justify-center cursor-pointer`}
                                                onClick={() => toggleSelectImage(index)}
                                            >
                                                {selectedImages.includes(index) && <FaCheck size={12} />}
                                            </div>
                                            <Image
                                                src={`data:image/jpeg;base64,${match}`}
                                                alt={`Match ${index + 1}`}
                                                fill
                                                style={{ objectFit: 'contain' }}
                                                className="hover:scale-105 transition-transform duration-300 rounded-md cursor-pointer"
                                                onClick={() => openImageModal(index)}
                                                priority={index < 3}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Terms Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Terms of Use for Facial Recognition</h2>
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="w-6 h-6 bg-gray-500 border rounded-full text-white hover:text-gray-700 flex items-center justify-center hover:bg-gray-100"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="text-sm text-gray-700 overflow-y-auto max-h-96">
                            <h3 className="font-semibold">Facial Recognition Usage Precautions</h3>
                            <ul className="list-disc pl-5 mb-4">
                                <p>1.Do not upload other people&apos;s facial images without permission. If necessary, obtain the consent of the individual (or their guardian) for the use of their facial information.</p>
                                <p>2.Do not privately edit, disseminate, or engage in other illegal, unethical, or immoral activities with the photos you find.</p>
                            </ul>
                            <h3 className="font-semibold">Public Notice of Facial Information Processing Rules</h3>
                            <ul className="list-disc pl-5 mb-4">
                                <p>1.Statement: Facial information is important personal information for you. Refusing to provide this facial information will not affect your normal viewing of album content. If you agree to use the facial recognition function to quickly find your related photos, you need to understand that processing facial information is a necessary step for the facial recognition function, otherwise, you will not be able to use this function normally.</p>
                                <p>2.If the album manager enables the &quot;search photos by face&quot; function, viewers can upload facial information and search for photos containing that face. The search results will only be returned to the searcher.</p>
                                <p>3.If the album manager enables the &quot;automatic photo facial recognition&quot; function, the live album large image page will automatically recognize the faces included in the photos. The collected faces will be listed at the bottom of the page, and clicking on a face will search for photos containing that face.</p>
                                <p>4.Except for quick photo searches, the live album will not privately collect, store, use, process, transmit, provide, or disclose facial information at will.</p>
                            </ul>
                            <h3 className="font-semibold">Disclaimer</h3>
                            <p className="mb-4">Facial information is important personal information for you. Refusing to provide this facial information will not affect your normal viewing of album content. Using other people&apos;s facial information should be authorized by the rights holder. You should use facial information cautiously and avoid infringing on the legitimate rights and interests of others. The album manager should enable the &quot;automatic photo facial recognition&quot; function only after obtaining authorization from the subjects of the album for the use of their facial information. The live album processes facial information only according to the &quot;Public Notice of Facial Information Processing Rules&quot; described above. If the album manager enables this function without legal authorization, they will be responsible for any resulting liabilities and disputes. Any disputes and consequences arising from facial recognition are unrelated to the live album and its associated entities.</p>
                            <p>If you have any objections to the above terms, you can immediately request the album manager to stop using the facial recognition functions related to your personal information and fully communicate with the album manager or event organizer to resolve the dispute. This live album will actively cooperate with you to protect your rights.</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Image View Modal */}
            {viewImageModal !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                    <div className="relative w-full max-w-4xl h-full max-h-screen p-4 flex flex-col">
                        <button
                            onClick={() => setViewImageModal(null)}
                            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 text-black hover:bg-gray-200"
                        >
                            <FaTimes size={20} />
                        </button>
                        
                        <div className="flex-1 flex items-center justify-center">
                            <div className="relative w-full h-full">
                                <Image
                                    src={`data:image/jpeg;base64,${matches[viewImageModal]}`}
                                    alt={`Match ${viewImageModal + 1}`}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    className="rounded-md"
                                    priority
                                />
                            </div>
                        </div>
                        
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={() => downloadImage(matches[viewImageModal], viewImageModal)}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                            >
                                <FaDownload /> Download Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
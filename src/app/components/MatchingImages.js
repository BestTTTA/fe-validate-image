"use client"
import Image from 'next/image'
import { FaDownload, FaCheck, FaTimes } from "react-icons/fa";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useState } from 'react'

export default function MatchingImages({ matches, onClose }) {
    const [selectedImages, setSelectedImages] = useState([])
    const [viewImageModal, setViewImageModal] = useState(null)
    const [downloadingZip, setDownloadingZip] = useState(false)

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
            downloadImage(matches[imagesToDownload[0]], imagesToDownload[0])
        } else {
            try {
                setDownloadingZip(true)
                const zip = new JSZip();
                
                imagesToDownload.forEach((index) => {
                    const base64Data = matches[index];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    zip.file(`match-${index + 1}.jpg`, bytes.buffer, {binary: true});
                });
                
                const content = await zip.generateAsync({type: 'blob'});
                saveAs(content, 'matches.zip');
            } catch (error) {
                console.error('Error creating zip file:', error);
            } finally {
                setDownloadingZip(false);
            }
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-900 z-50">
            <div className="h-full p-4 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-white font-extrabold text-2xl sm:text-3xl">Matching Images</h2>
                    <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
                        <button 
                            onClick={selectAllImages}
                            className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            {selectedImages.length === matches.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button 
                            onClick={downloadSelectedImages}
                            disabled={matches.length === 0 || downloadingZip}
                            className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md flex items-center justify-center gap-2 disabled:bg-gray-400 text-sm sm:text-base"
                        >
                            <FaDownload className="mr-1" /> 
                            {downloadingZip ? 'Creating Zip...' : selectedImages.length > 0 
                                ? `Download (${selectedImages.length})` 
                                : 'Download All'}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-md flex items-center justify-center text-sm sm:text-base"
                        >
                            Back
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {matches.map((match, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-square relative w-full overflow-hidden">
                                <div 
                                    className={`absolute top-2 left-2 z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                                        selectedImages.includes(index) 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-white border border-gray-300'
                                    } flex items-center justify-center cursor-pointer`}
                                    onClick={() => toggleSelectImage(index)}
                                >
                                    {selectedImages.includes(index) && <FaCheck size={10} className="sm:text-xs" />}
                                </div>
                                <Image
                                    src={`data:image/jpeg;base64,${match}`}
                                    alt={`Match ${index + 1}`}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    className="hover:scale-105 transition-transform duration-300 rounded-md cursor-pointer"
                                    onClick={() => setViewImageModal(index)}
                                    priority={index < 6}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {viewImageModal !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="relative w-full max-w-4xl h-full max-h-screen flex flex-col">
                        <button
                            onClick={() => setViewImageModal(null)}
                            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white rounded-full p-1.5 sm:p-2 text-black hover:bg-gray-200"
                        >
                            <FaTimes size={16} className="sm:text-xl" />
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
                        
                        <div className="mt-2 sm:mt-4 flex justify-center">
                            <button
                                onClick={() => downloadImage(matches[viewImageModal], viewImageModal)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md flex items-center gap-2 text-sm sm:text-base"
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
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FaDownload, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const getImageSource = (imageData) => {
    // Check for different possible image URL properties
    const imageUrl = imageData.image_url || imageData.url || imageData.base64;
    if (!imageUrl) return null;

    // Handle different URL formats
    if (imageUrl.startsWith('data:')) {
        return imageUrl;
    } else if (imageUrl.startsWith('http://')) {
        // แก้ไขตรงนี้: เปลี่ยนเป็นใช้ proxy API หรือกระบวนการอื่นที่ปลอดภัย
        return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    } else if (imageUrl.startsWith('https://')) {
        return imageUrl;
    } else if (imageUrl.startsWith('/images/')) {
        // Prepend the API base URL if needed
        return `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
    } else {
        return `data:image/jpeg;base64,${imageUrl}`;
    }
};

const MatchingImages = ({ matches, onClose }) => {
    const [selectedImages, setSelectedImages] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [loadingStates, setLoadingStates] = useState({});
    const [previewImage, setPreviewImage] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Initialize loading states for all images
    useEffect(() => {
        const initialLoadingStates = {};
        matches.forEach((_, index) => {
            initialLoadingStates[index] = true;
        });
        setLoadingStates(initialLoadingStates);
    }, [matches]);

    const handleImageLoaded = (index) => {
        setLoadingStates(prev => ({ ...prev, [index]: false }));
    };

    const handleImageClick = (index) => {
        if (!isSelecting) {
            setPreviewImage(matches[index]);
            setCurrentImageIndex(index);
        }
    };

    const handlePrevImage = () => {
        const newIndex = (currentImageIndex - 1 + matches.length) % matches.length;
        setPreviewImage(matches[newIndex]);
        setCurrentImageIndex(newIndex);
    };

    const handleNextImage = () => {
        const newIndex = (currentImageIndex + 1) % matches.length;
        setPreviewImage(matches[newIndex]);
        setCurrentImageIndex(newIndex);
    };

    const handleKeyDown = useCallback((e) => {
        if (previewImage) {
            if (e.key === 'ArrowLeft') handlePrevImage();
            if (e.key === 'ArrowRight') handleNextImage();
            if (e.key === 'Escape') setPreviewImage(null);
        }
    }, [previewImage, currentImageIndex, matches.length]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const toggleSelectionMode = () => {
        setIsSelecting(!isSelecting);
        setSelectedImages([]);
    };

    const toggleImageSelection = (index) => {
        if (selectedImages.includes(index)) {
            setSelectedImages(selectedImages.filter(i => i !== index));
        } else {
            setSelectedImages([...selectedImages, index]);
        }
    };

    const selectAllImages = () => {
        if (selectedImages.length === matches.length) {
            setSelectedImages([]);
        } else {
            setSelectedImages(matches.map((_, index) => index));
        }
    };

    const base64ToBlob = (base64, contentType = 'image/jpeg') => {
        try {
            const base64Data = base64.includes('data:')
                ? base64.split(',')[1]
                : base64;
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            return new Blob(byteArrays, { type: contentType });
        } catch (error) {
            console.error("Error converting base64 to blob:", error);
            return null;
        }
    };

    const downloadImage = (imageData, index) => {
        try {
            const imageUrl = imageData.image_url || imageData.url || imageData.base64;
            if (!imageUrl) return;
            
            if (imageUrl.startsWith('data:')) {
                const blob = base64ToBlob(imageUrl);
                if (blob) {
                    saveAs(blob, `matched-image-${index}.jpg`);
                }
            } else if (imageUrl.startsWith('http')) {
                // ใช้ URL ต้นฉบับสำหรับการดาวน์โหลด (ไม่ผ่าน proxy)
                const originalUrl = imageUrl;
                fetch(originalUrl)
                    .then(res => res.blob())
                    .then(blob => saveAs(blob, `matched-image-${index}.jpg`))
                    .catch(err => {
                        console.error("Error downloading image:", err);
                        // ถ้าเกิดข้อผิดพลาด ลองใช้ proxy
                        fetch(`/api/proxy-image?url=${encodeURIComponent(originalUrl)}`)
                            .then(res => res.blob())
                            .then(blob => saveAs(blob, `matched-image-${index}.jpg`))
                            .catch(error => console.error("Error downloading via proxy:", error));
                    });
            } else {
                const blob = base64ToBlob(imageUrl);
                if (blob) {
                    saveAs(blob, `matched-image-${index}.jpg`);
                }
            }
        } catch (error) {
            console.error("Error downloading image:", error);
        }
    };
    
    const downloadSelectedImages = async () => {
        if (selectedImages.length === 0) return;
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            for (let i of selectedImages) {
                const imageData = matches[i];
                const imageUrl = imageData.image_url || imageData.url || imageData.base64;
                if (!imageUrl) continue;
                
                let imageBlob = null;
                if (imageUrl.startsWith('data:')) {
                    imageBlob = base64ToBlob(imageUrl);
                } else if (imageUrl.startsWith('http')) {
                    try {
                        // ใช้ URL ต้นฉบับก่อน
                        const res = await fetch(imageUrl);
                        imageBlob = await res.blob();
                    } catch (error) {
                        console.error("Error fetching image, trying proxy:", error);
                        // ถ้าเกิดข้อผิดพลาด ลองใช้ proxy
                        try {
                            const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
                            imageBlob = await res.blob();
                        } catch (proxyError) {
                            console.error("Error fetching image via proxy:", proxyError);
                        }
                    }
                } else {
                    imageBlob = base64ToBlob(imageUrl);
                }
                
                if (imageBlob) {
                    zip.file(`matched-image-${i}.jpg`, imageBlob);
                }
            }
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "selected-images.zip");
        } catch (error) {
            console.error("Error creating ZIP file:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50 p-2 sm:p-4 overflow-hidden">
            <div className="w-full h-full max-w-7xl flex flex-col border-white border-2 sm:border-4 shadow-xl drop-shadow-md bg-black rounded-lg sm:rounded-2xl p-3 sm:p-6 overflow-y-auto">
                {/* Header - Responsive layout */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 sticky top-0 bg-black p-2 z-10">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-0">
                        Matching Images ({matches.length})
                    </h2>
                    
                    {/* Mobile buttons - stack vertically */}
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            onClick={toggleSelectionMode}
                            className={`px-2 py-1 rounded text-xs sm:text-sm ${isSelecting ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'}`}
                        >
                            {isSelecting ? 'Cancel Selection' : 'Select Images'}
                        </button>
                        
                        {isSelecting && (
                            <>
                                <button
                                    onClick={selectAllImages}
                                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs sm:text-sm"
                                >
                                    {selectedImages.length === matches.length ? 'Deselect All' : 'Select All'}
                                </button>
                                
                                {selectedImages.length > 0 && (
                                    <button
                                        onClick={downloadSelectedImages}
                                        disabled={selectedImages.length === 0 || isDownloading}
                                        className="bg-green-500 text-white px-2 py-1 rounded text-xs sm:text-sm flex items-center gap-1 disabled:bg-gray-400"
                                    >
                                        <FaDownload size={10} />
                                        {isDownloading ? 'Downloading...' : `Download (${selectedImages.length})`}
                                    </button>
                                )}
                            </>
                        )}
                        
                        <button
                            onClick={onClose}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs sm:text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Grid - Responsive columns */}
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 overflow-y-auto">
                    {matches.map((match, index) => {
                        // Filter: only show matches with confidence > 60%
                        if (match.confidence <= 60) return null;

                        const imageSource = getImageSource(match);
                        const isSelected = selectedImages.includes(index);
                        const isLoading = loadingStates[index];

                        return (
                            <div
                                key={index}
                                className={`relative rounded-lg ${isSelecting ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 sm:ring-4 ring-blue-500' : ''} hover:opacity-90 transition-opacity`}
                                onClick={() => isSelecting ? toggleImageSelection(index) : handleImageClick(index)}
                            >
                                <div className="aspect-square w-full h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden bg-gray-800">
                                    {isLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    {imageSource ? (
                                        <Image
                                            src={imageSource}
                                            alt={`Match ${index + 1}`}
                                            width={300}
                                            height={300}
                                            className="object-cover w-full h-full"
                                            unoptimized={true}
                                            onLoad={() => handleImageLoaded(index)}
                                            onError={(e) => {
                                                handleImageLoaded(index);
                                                e.target.onerror = null;
                                                e.target.src = '/placeholder-image.png';
                                            }}
                                        />
                                    ) : (
                                        <div className="bg-gray-800 w-full h-full flex items-center justify-center">
                                            <span className="text-gray-300 text-xs sm:text-sm">Image not available</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1 sm:p-2 text-white text-xs">
                                    {match.confidence && (
                                        <div>Similarity: {match.confidence.toFixed(1)}%</div>
                                    )}
                                    {!isSelecting && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadImage(match, index);
                                            }}
                                            className="mt-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                        >
                                            <FaDownload size={10} /> Download
                                        </button>
                                    )}
                                </div>
                                {isSelecting && (
                                    <div className="absolute top-2 right-2">
                                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-blue-500' : 'bg-white bg-opacity-70'}`}>
                                            {isSelected && <span className="text-white text-xs">✓</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Image Preview - Made responsive */}
            {previewImage && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="relative max-w-4xl w-full h-[80vh] flex items-center justify-center">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 z-10"
                        >
                            <FaTimes size={20} />
                        </button>
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-1 sm:left-4 text-white hover:text-gray-300 z-10"
                        >
                            <FaChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleNextImage}
                            className="absolute right-1 sm:right-4 text-white hover:text-gray-300 z-10"
                        >
                            <FaChevronRight size={20} />
                        </button>
                        <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-0">
                            <Image
                                src={getImageSource(previewImage)}
                                alt={`Preview ${currentImageIndex + 1}`}
                                width={800}
                                height={800}
                                className="object-contain max-h-full max-w-full"
                                unoptimized={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchingImages;
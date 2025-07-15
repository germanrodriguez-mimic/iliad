import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BACKEND_URL } from '../config/api'

interface ConfigurationImagesProps {
  mediaUrls: string[]
  variantId: number
}

const ConfigurationImages: React.FC<ConfigurationImagesProps> = ({ mediaUrls, variantId }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [base64Images, setBase64Images] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Filter and categorize images based on their filenames
  const startImage = mediaUrls.find(url => url.includes(`_${variantId}_start`))
  const endImage = mediaUrls.find(url => url.includes(`_${variantId}_end`))

  // Download images as base64 when component mounts
  useEffect(() => {
    const downloadImages = async () => {
      const gsutilUris = [startImage, endImage].filter(Boolean) as string[]
      
      if (gsutilUris.length > 0) {
        setIsLoading(true)
        try {
          const response = await axios.post(`${BACKEND_URL}/api/v1/upload/images/base64`, gsutilUris)
          const imageMap: { [key: string]: string } = {}
          gsutilUris.forEach((uri, index) => {
            imageMap[uri] = response.data.images[index]
          })
          setBase64Images(imageMap)
        } catch (error) {
          console.error('Failed to download images:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    downloadImages()
  }, [startImage, endImage])

  if (!startImage && !endImage) {
    return null
  }

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const getBase64Image = (gsutilUri: string) => {
    return base64Images[gsutilUri] || gsutilUri
  }

  if (isLoading) {
    return (
      <div className="mt-3">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Configuration Images</h4>
        <div className="text-xs text-gray-400">Loading images...</div>
      </div>
    )
  }

  return (
    <>
      <div className="mt-3">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Configuration Images</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {startImage && (
            <div className="border border-border rounded p-2 bg-surface">
              <h5 className="text-xs font-medium text-gray-400 mb-1">Start Configuration</h5>
              <div className="relative group cursor-pointer" onClick={() => openImageModal(getBase64Image(startImage))}>
                <img
                  src={getBase64Image(startImage)}
                  alt="Start configuration"
                  className="w-full h-24 object-contain rounded border border-border hover:border-accent transition-colors"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden absolute inset-0 bg-background/80 flex items-center justify-center text-xs text-gray-400 rounded">
                  Image not available
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    Click to enlarge
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {endImage && (
            <div className="border border-border rounded p-2 bg-surface">
              <h5 className="text-xs font-medium text-gray-400 mb-1">End Configuration</h5>
              <div className="relative group cursor-pointer" onClick={() => openImageModal(getBase64Image(endImage))}>
                <img
                  src={getBase64Image(endImage)}
                  alt="End configuration"
                  className="w-full h-24 object-contain rounded border border-border hover:border-accent transition-colors"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden absolute inset-0 bg-background/80 flex items-center justify-center text-xs text-gray-400 rounded">
                  Image not available
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    Click to enlarge
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-accent text-2xl"
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Configuration"
              className="max-w-full max-h-full object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default ConfigurationImages 
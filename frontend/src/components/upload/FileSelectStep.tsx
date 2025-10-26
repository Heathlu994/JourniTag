import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, MapPin } from 'lucide-react'
import { UploadState } from '@/types'
import { extractExifData, hasExifData } from '@/lib/exif'

interface FileSelectStepProps {
  onFilesSelected: (files: File[], previews: UploadState['previews']) => void
  onClose: () => void
}

export function FileSelectStep({ onFilesSelected, onClose }: FileSelectStepProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<UploadState['previews']>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[]) => {
    console.log('Files selected:', selectedFiles)
    const fileArray = Array.from(selectedFiles)

    // Filter for supported image types
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    const imageFiles = fileArray.filter(file =>
      file.type.startsWith('image/') && supportedTypes.includes(file.type.toLowerCase())
    )

    console.log('Image files:', imageFiles)

    if (imageFiles.length === 0) {
      alert('Please select supported image files (JPEG, PNG, GIF, WebP, BMP). HEIC files are not supported in web browsers.')
      return
    }

    const newFiles = [...files, ...imageFiles]
    setFiles(newFiles)

    // Create previews for new files with EXIF data
    const newPreviews = await Promise.all(imageFiles.map(async (file) => {
      console.log('Creating preview for file:', file.name, file.type, file.size)

      // Create a more reliable preview using FileReader
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string)
          } else {
            reject(new Error('Failed to read file'))
          }
        }
        reader.onerror = () => reject(new Error('FileReader error'))
        reader.readAsDataURL(file)
      })

      let exifData

      // Extract EXIF data if the file supports it
      if (hasExifData(file)) {
        try {
          exifData = await extractExifData(file)
        } catch (error) {
          console.warn('Failed to extract EXIF data:', error)
        }
      }

      return {
        file,
        preview,
        coordinates: exifData?.latitude && exifData?.longitude ? {
          x: exifData.longitude,
          y: exifData.latitude,
        } : undefined,
        exifData,
      }
    }))

    setPreviews(prev => [...prev, ...newPreviews])
    console.log('Updated files:', newFiles)
    console.log('Updated previews:', [...previews, ...newPreviews])
  }, [files])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    console.log('Files dropped:', droppedFiles)
    handleFileSelect(droppedFiles)
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files)
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }, [handleFileSelect])

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)

    setFiles(newFiles)
    setPreviews(newPreviews)
  }, [files, previews])

  const handleContinue = useCallback(() => {
    if (files.length === 0) {
      alert('Please select at least one photo.')
      return
    }
    onFilesSelected(files, previews)
  }, [files, previews, onFilesSelected])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview.preview)
        }
      })
    }
  }, [previews])

  return (
    <div className="space-y-6">
      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Upload Photos</h3>
        <p className="text-gray-600 mb-4">
          Drag and drop your photos here, or click to browse
        </p>
        <Button
          onClick={(e) => {
            e.stopPropagation()
            openFileDialog()
          }}
          variant="outline"
        >
          Choose Files
        </Button>
      </div>

      {/* Selected files preview */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold">Selected Photos ({files.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={preview.preview}
                    alt={`Preview ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      display: 'block'
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', preview.preview)
                      // Show a placeholder instead of hiding the image
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PHRleHQgeD0iNTAiIHk9IjcwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GYWlsZWQ8L3RleHQ+PC9zdmc+'
                    }}
                  />
                  {preview.coordinates && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      GPS
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile(index)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(preview.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  {preview.coordinates && (
                    <p className="text-xs text-green-600">
                      📍 {preview.coordinates.y.toFixed(4)}, {preview.coordinates.x.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons - Always visible and sticky */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-6 -mx-6 px-6 py-4 shadow-lg">
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={files.length === 0}
            className={`px-6 py-2 ${files.length === 0 ? 'opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Continue ({files.length} photos)
          </Button>
        </div>
      </div>
    </div>
  )
}

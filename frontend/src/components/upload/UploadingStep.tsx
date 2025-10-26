import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Check, Upload, AlertCircle } from 'lucide-react'
import { UploadState, Trip, Location } from '@/types'

interface UploadingStepProps {
  uploadState: UploadState
  onClose: () => void
  onUploadComplete?: (trip?: Trip, locations?: Location[]) => void
}

export function UploadingStep({ uploadState, onClose, onUploadComplete }: UploadingStepProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If we already have upload results, show completion immediately
    if (uploadState.uploadResults) {
      setIsComplete(true)
      setCurrentStep('Processing complete!')
      setProgress(100)
      return
    }

    // Simulate upload progress
    const steps = [
      'Preparing photos...',
      'Extracting metadata...',
      'Creating trip...',
      'Creating location...',
      'Uploading photos...',
      'Processing complete!'
    ]

    let currentStepIndex = 0
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setCurrentStep(steps[currentStepIndex])
        setProgress((currentStepIndex + 1) / steps.length * 100)
        currentStepIndex++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [uploadState.uploadResults])

  const handleClose = () => {
    if (isComplete) {
      // Call onUploadComplete with the results before closing
      if (onUploadComplete && uploadState.uploadResults) {
        onUploadComplete(uploadState.uploadResults.trip, uploadState.uploadResults.locations)
      }
      onClose()
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Upload Failed</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onClose}>Close</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 text-center">
        {isComplete ? (
          <>
            <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Upload Complete!</h3>
            <p className="text-gray-600 mb-4">
              Successfully uploaded {uploadState.previews.length} photos
            </p>
            <Button onClick={handleClose}>Done</Button>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Uploading Photos</h3>
            <p className="text-gray-600 mb-4">{currentStep}</p>
            <Progress value={progress} className="mb-4" />
            <p className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </p>
          </>
        )}
      </Card>

      {/* Photo preview during upload */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Uploading {uploadState.previews.length} photos</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadState.previews.map((preview, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg border relative">
              <img
                src={preview.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {isComplete && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

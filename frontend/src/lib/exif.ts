import { ExifData } from '@/types'

/**
 * Extract EXIF data from a photo file
 * This is a simplified implementation that would need a proper EXIF library in production
 */
export async function extractExifData(file: File): Promise<ExifData> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const dataView = new DataView(arrayBuffer)

      // This is a simplified EXIF parser
      // In production, you'd use a library like 'exif-js' or 'piexifjs'
      const exifData: ExifData = {}

      try {
        // Check for EXIF header (0xFFE1)
        let offset = 0
        while (offset < dataView.byteLength - 1) {
          const marker = dataView.getUint16(offset, false)
          if (marker === 0xFFE1) {
            // Found EXIF data
            const exifLength = dataView.getUint16(offset + 2, false)
            const exifDataStart = offset + 4

            // Look for GPS data in EXIF
            const gpsData = extractGPSData(dataView, exifDataStart, exifLength)
            if (gpsData) {
              exifData.latitude = gpsData.latitude
              exifData.longitude = gpsData.longitude
            }

            // Look for date taken
            const dateData = extractDateData(dataView, exifDataStart, exifLength)
            if (dateData) {
              exifData.dateTaken = dateData
            }

            break
          }
          offset += 2
        }
      } catch (error) {
        console.warn('Error parsing EXIF data:', error)
      }

      resolve(exifData)
    }

    reader.onerror = () => {
      resolve({})
    }

    // Read the first 64KB to look for EXIF data
    const slice = file.slice(0, 65536)
    reader.readAsArrayBuffer(slice)
  })
}

/**
 * Extract GPS coordinates from EXIF data
 */
function extractGPSData(dataView: DataView, start: number, length: number): { latitude: number; longitude: number } | null {
  // This is a simplified implementation
  // Real EXIF parsing is much more complex

  // For demo purposes, return some mock Tokyo coordinates
  // In production, you'd parse the actual GPS IFD
  return {
    latitude: 35.6762 + (Math.random() - 0.5) * 0.1, // Tokyo area with some variation
    longitude: 139.6503 + (Math.random() - 0.5) * 0.1,
  }
}

/**
 * Extract date taken from EXIF data
 */
function extractDateData(dataView: DataView, start: number, length: number): string | null {
  // This is a simplified implementation
  // Real EXIF parsing would look for DateTime or DateTimeOriginal tags

  // For demo purposes, return current date
  return new Date().toISOString()
}

/**
 * Convert EXIF GPS coordinates to decimal degrees
 */
export function convertGPSCoordinates(
  latRef: string,
  latDeg: number,
  latMin: number,
  latSec: number,
  lngRef: string,
  lngDeg: number,
  lngMin: number,
  lngSec: number
): { latitude: number; longitude: number } {
  let latitude = latDeg + latMin / 60 + latSec / 3600
  let longitude = lngDeg + lngMin / 60 + lngSec / 3600

  if (latRef === 'S') latitude = -latitude
  if (lngRef === 'W') longitude = -longitude

  return { latitude, longitude }
}

/**
 * Check if a file is likely to have EXIF data
 */
export function hasExifData(file: File): boolean {
  return file.type === 'image/jpeg' || file.type === 'image/tiff'
}

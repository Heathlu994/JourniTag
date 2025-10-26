/**
 * API Service Layer
 * All backend API calls are abstracted here with placeholder implementations
 * Backend team: Replace mock responses with actual API calls
 */

import axios, { AxiosInstance } from 'axios'
import type {
  User,
  Trip,
  Location,
  Photo,
  SharedTrip,
  CreateTripRequest,
  UpdateTripRequest,
  CreateLocationRequest,
  UpdateLocationRequest,
  UploadPhotoRequest,
  ShareTripRequest,
  TripFilters,
} from '@/types'

// ============================================
// In-memory store for uploaded data
// ============================================
const uploadedPhotosStore: { [tripId: string]: Photo[] } = {}
const uploadedLocationsStore: { [locationId: string]: Location } = {}
const createdTripsStore: { [tripId: string]: Trip } = {}

// ============================================
// Axios Instance Configuration
// ============================================

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For session-based auth
})

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    // Backend: Add auth token if needed
    // const token = localStorage.getItem('auth_token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================
// Auth API
// ============================================

export const authAPI = {
  /**
   * Register a new user
   * Backend endpoint: POST /api/auth/register
   * Request body: { email: string, name: string, password: string }
   * Response: { user: User, token?: string }
   */
  register: async (data: { email: string; name: string; password: string }): Promise<User> => {
    // PLACEHOLDER: Replace with actual API call
    console.log('authAPI.register called with:', data)
    return Promise.resolve({
      id: '1',
      email: data.email,
      name: data.name,
      created_at: new Date().toISOString(),
    })
  },

  /**
   * Login user
   * Backend endpoint: POST /api/auth/login
   * Request body: { email: string, password: string }
   * Response: { user: User, token?: string }
   */
  login: async (data: { email: string; password: string }): Promise<User> => {
    // PLACEHOLDER
    console.log('authAPI.login called with:', data)
    return Promise.resolve({
      id: '1',
      email: data.email,
      name: 'Test User',
      created_at: new Date().toISOString(),
    })
  },

  /**
   * Logout user
   * Backend endpoint: POST /api/auth/logout
   * Response: { success: boolean }
   */
  logout: async (): Promise<void> => {
    // PLACEHOLDER
    console.log('authAPI.logout called')
    return Promise.resolve()
  },

  /**
   * Get current user session
   * Backend endpoint: GET /api/auth/session
   * Response: { user: User | null }
   */
  getCurrentUser: async (): Promise<User | null> => {
    // PLACEHOLDER
    console.log('authAPI.getCurrentUser called')
    return Promise.resolve(null)
  },
}

// ============================================
// Trip API
// ============================================

export const tripAPI = {
  /**
   * Get all trips for current user
   * Backend endpoint: GET /api/trips
   * Query params: ?search=&country=&year=&minRating=
   * Response: { trips: Trip[] }
   */
  getTrips: async (filters?: TripFilters): Promise<Trip[]> => {
    // PLACEHOLDER - return mock data for now
    console.log('tripAPI.getTrips called with filters:', filters)
    const { mockTrips } = await import('@/lib/mockData')
    return Promise.resolve(mockTrips)
  },

  /**
   * Get single trip by ID with all photos and locations
   * Backend endpoint: GET /api/trips/:id
   * Response: { trip: Trip, locations: Location[], photos: Photo[] }
   */
  getTripById: async (tripId: string): Promise<{ trip: Trip; locations: Location[]; photos: Photo[] }> => {
    // PLACEHOLDER - return mock data for now
    console.log('tripAPI.getTripById called with:', tripId)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Get the uploaded photos from the store
    const storedPhotos = uploadedPhotosStore[tripId] || []
    console.log('Retrieved stored photos for trip:', tripId, storedPhotos)

    // Get the created trip from the store
    const storedTrip = createdTripsStore[tripId]
    console.log('Retrieved stored trip for tripId:', tripId, storedTrip)

    // Use stored trip if available, otherwise return mock data
    const tripToReturn = storedTrip || {
      id: tripId,
      user_id: '1',
      title: 'New Trip',
      city: 'Tokyo',
      country: 'Japan',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days later
      created_at: new Date().toISOString(),
      rating: 0,
    }

    // Create mock photos for this location using realistic coordinates
    // These will be replaced with actual photo coordinates from the upload
    const tripMockPhotos: Photo[] = [
      {
        id: `photo-${tripId}-1`,
        location_id: `location-${tripId}`,
        user_id: '1',
        x: 139.6503, // longitude - will be updated with actual photo coordinates
        y: 35.6762,  // latitude - will be updated with actual photo coordinates
        file_url: '/src/assets/test-photos/pic-1.png',
        original_filename: 'uploaded-photo-1.jpg',
        taken_at: new Date().toISOString(),
        is_cover_photo: true,
      },
      {
        id: `photo-${tripId}-2`,
        location_id: `location-${tripId}`,
        user_id: '1',
        x: 139.6503, // longitude - will be updated with actual photo coordinates
        y: 35.6762,  // latitude - will be updated with actual photo coordinates
        file_url: '/src/assets/test-photos/pic-2.png',
        original_filename: 'uploaded-photo-2.jpg',
        taken_at: new Date().toISOString(),
        is_cover_photo: false,
      }
    ]

    // Create a mock location for this trip
    const mockLocation: Location = {
      id: `location-${tripId}`,
      trip_id: tripId,
      name: 'New Location',
      address: 'New Address',
      latitude: 35.6762, // Tokyo coordinates
      longitude: 139.6503,
      rating: 0,
      image: '',
      created_at: new Date().toISOString(),
      photos: tripMockPhotos, // Add photos to the location
    }

    const result = {
      trip: tripToReturn,
      locations: [mockLocation],
      photos: storedPhotos.length > 0 ? storedPhotos : tripMockPhotos, // Use stored photos if available
    }
    console.log('tripAPI.getTripById returning:', result)
    return Promise.resolve(result)
  },

  /**
   * Create new trip
   * Backend endpoint: POST /api/trips
   * Request body: CreateTripRequest
   * Response: { trip: Trip }
   */
  createTrip: async (data: CreateTripRequest): Promise<Trip> => {
    // PLACEHOLDER - simulate API delay
    console.log('tripAPI.createTrip called with:', data)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newTrip: Trip = {
      id: Date.now().toString(),
      user_id: '1',
      ...data,
      created_at: new Date().toISOString(),
      rating: 0,
    }

    // Store the created trip
    createdTripsStore[newTrip.id] = newTrip
    console.log('Stored trip in createdTripsStore:', newTrip)

    return Promise.resolve(newTrip)
  },

  /**
   * Update trip
   * Backend endpoint: PUT /api/trips/:id
   * Request body: UpdateTripRequest
   * Response: { trip: Trip }
   */
  updateTrip: async (data: UpdateTripRequest): Promise<Trip> => {
    // PLACEHOLDER
    console.log('tripAPI.updateTrip called with:', data)
    return Promise.resolve({} as Trip)
  },

  /**
   * Delete trip
   * Backend endpoint: DELETE /api/trips/:id
   * Response: { success: boolean }
   */
  deleteTrip: async (tripId: string): Promise<void> => {
    // PLACEHOLDER
    console.log('tripAPI.deleteTrip called with:', tripId)
    return Promise.resolve()
  },
}

// ============================================
// Location API
// ============================================

export const locationAPI = {
  /**
   * Get all locations for a trip
   * Backend endpoint: GET /api/trips/:tripId/locations
   * Response: { locations: Location[] }
   */
  getLocationsByTrip: async (tripId: string): Promise<Location[]> => {
    // PLACEHOLDER
    console.log('locationAPI.getLocationsByTrip called with:', tripId)
    return Promise.resolve([])
  },

  /**
   * Get single location by ID
   * Backend endpoint: GET /api/locations/:id
   * Response: { location: Location, photos: Photo[] }
   */
  getLocationById: async (locationId: string): Promise<{ location: Location; photos: Photo[] }> => {
    // PLACEHOLDER - return mock data for now
    console.log('locationAPI.getLocationById called with:', locationId)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Get the uploaded photos from the store (keyed by location id)
    const storedPhotos = uploadedPhotosStore[locationId] || []
    console.log('Retrieved stored photos for location:', locationId, storedPhotos)

    // Get the created location from the store
    const storedLocation = uploadedLocationsStore[locationId]
    console.log('Retrieved stored location for locationId:', locationId, storedLocation)

    // Create mock photos for this location
    const locationPhotos: Photo[] = [
      {
        id: `photo-${locationId}-1`,
        location_id: locationId,
        user_id: '1',
        x: 139.6503, // longitude
        y: 35.6762,  // latitude
        file_url: '/src/assets/test-photos/pic-1.png',
        original_filename: 'uploaded-photo-1.jpg',
        taken_at: new Date().toISOString(),
        is_cover_photo: true,
      },
      {
        id: `photo-${locationId}-2`,
        location_id: locationId,
        user_id: '1',
        x: 139.6503, // longitude
        y: 35.6762,  // latitude
        file_url: '/src/assets/test-photos/pic-2.png',
        original_filename: 'uploaded-photo-2.jpg',
        taken_at: new Date().toISOString(),
        is_cover_photo: false,
      }
    ]

    // For newly created locations, we'll return a mock location with photos
    // Use realistic coordinates (Tokyo area)
    const mockLocation: Location = {
      id: locationId,
      trip_id: '1',
      name: 'New Location',
      address: 'New Address',
      latitude: 35.6762, // Tokyo coordinates
      longitude: 139.6503,
      rating: 0,
      image: '',
      created_at: new Date().toISOString(),
      photos: locationPhotos, // Add photos to the location
    }

    const result = {
      location: storedLocation || mockLocation, // Use stored location if available
      photos: storedPhotos.length > 0 ? storedPhotos : locationPhotos, // Use stored photos if available
    }
    console.log('locationAPI.getLocationById returning:', result)
    return Promise.resolve(result)
  },

  /**
   * Create new location
   * Backend endpoint: POST /api/locations
   * Request body: CreateLocationRequest
   * Response: { location: Location }
   */
  createLocation: async (data: CreateLocationRequest): Promise<Location> => {
    // PLACEHOLDER - simulate API delay
    console.log('locationAPI.createLocation called with:', data)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newLocation: Location = {
      id: Date.now().toString(),
      ...data,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
      photos: [],
    }

    // Store the created location
    uploadedLocationsStore[newLocation.id] = newLocation
    console.log('Stored location in uploadedLocationsStore:', newLocation)

    return Promise.resolve(newLocation)
  },

  /**
   * Update location
   * Backend endpoint: PUT /api/locations/:id
   * Request body: UpdateLocationRequest
   * Response: { location: Location }
   */
  updateLocation: async (data: UpdateLocationRequest): Promise<Location> => {
    console.log('locationAPI.updateLocation called with:', data)
    // Update in-memory location store
    const existing = uploadedLocationsStore[data.id]
    const updated: Location = {
      ...(existing || ({} as Location)),
      ...data,
      id: data.id,
      photos: existing?.photos || [],
      created_at: existing?.created_at || new Date().toISOString(),
    }
    uploadedLocationsStore[data.id] = updated
    return Promise.resolve(updated)
  },

  /**
   * Delete location
   * Backend endpoint: DELETE /api/locations/:id
   * Response: { success: boolean }
   */
  deleteLocation: async (locationId: string): Promise<void> => {
    // PLACEHOLDER
    console.log('locationAPI.deleteLocation called with:', locationId)
    return Promise.resolve()
  },
}

// ============================================
// Photo API
// ============================================

export const photoAPI = {
  /**
   * Get all photos for current user
   * Backend endpoint: GET /api/photos
   * Response: { photos: Photo[] }
   */
  getPhotos: async (): Promise<Photo[]> => {
    // PLACEHOLDER
    console.log('photoAPI.getPhotos called')
    return Promise.resolve([])
  },

  /**
   * Get photos by location
   * Backend endpoint: GET /api/locations/:locationId/photos
   * Response: { photos: Photo[] }
   */
  getPhotosByLocation: async (locationId: string): Promise<Photo[]> => {
    // PLACEHOLDER
    console.log('photoAPI.getPhotosByLocation called with:', locationId)
    return Promise.resolve([])
  },

  /**
   * Upload photo(s)
   * Backend endpoint: POST /api/photos
   * Request body: FormData with files and metadata
   * Response: { photos: Photo[] }
   *
   * Expected FormData fields:
   * - files: File[] (multiple files)
   * - location_id: string (optional)
   * - x: number (longitude)
   * - y: number (latitude)
   * - is_cover_photo: boolean
   */
  uploadPhotos: async (data: UploadPhotoRequest[]): Promise<Photo[]> => {
    // PLACEHOLDER - simulate API delay and return mock photos
    console.log('photoAPI.uploadPhotos called with:', data)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Backend: Build FormData like this:
    // const formData = new FormData()
    // data.forEach((item, index) => {
    //   formData.append('files', item.file)
    //   formData.append(`metadata[${index}]`, JSON.stringify({
    //     location_id: item.location_id,
    //     x: item.x,
    //     y: item.y,
    //     is_cover_photo: item.is_cover_photo,
    //   }))
    // })
    // return api.post('/photos', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' }
    // })

    // Return mock photos with actual coordinates from EXIF data
    const mockPhotos = data.map((item, index) => ({
      id: `uploaded-${Date.now()}-${index}`,
      location_id: item.location_id || '',
      user_id: '1',
      x: item.x || 0, // Use actual longitude from EXIF
      y: item.y || 0, // Use actual latitude from EXIF
      file_url: URL.createObjectURL(item.file),
      original_filename: item.file.name,
      taken_at: new Date().toISOString(),
      is_cover_photo: item.is_cover_photo || false,
    }))

    console.log('photoAPI.uploadPhotos returning photos with coordinates:', mockPhotos.map(p => ({ id: p.id, x: p.x, y: p.y })))

    // Store by locationId so detail views can retrieve immediately
    const locationIdKey = data[0]?.location_id || 'unknown'
    uploadedPhotosStore[locationIdKey] = mockPhotos

    return Promise.resolve(mockPhotos)
  },

  /**
   * Delete photo
   * Backend endpoint: DELETE /api/photos/:id
   * Response: { success: boolean }
   */
  deletePhoto: async (photoId: string): Promise<void> => {
    // PLACEHOLDER
    console.log('photoAPI.deletePhoto called with:', photoId)
    return Promise.resolve()
  },

  /**
   * Set photo as cover photo for location
   * Backend endpoint: PUT /api/photos/:id/set-cover
   * Response: { photo: Photo }
   */
  setCoverPhoto: async (photoId: string, locationId: string): Promise<Photo> => {
    // PLACEHOLDER
    console.log('photoAPI.setCoverPhoto called with:', { photoId, locationId })
    return Promise.resolve({} as Photo)
  },
}

// ============================================
// Share API
// ============================================

export const shareAPI = {
  /**
   * Share trip with another user
   * Backend endpoint: POST /api/trips/:tripId/share
   * Request body: { shared_with_email: string, expires_in_days?: number }
   * Response: { share_token: string, share_url: string }
   */
  shareTrip: async (data: ShareTripRequest): Promise<{ share_token: string; share_url: string }> => {
    // PLACEHOLDER
    console.log('shareAPI.shareTrip called with:', data)
    return Promise.resolve({
      share_token: 'mock-token-123',
      share_url: `${window.location.origin}/shared/mock-token-123`,
    })
  },

  /**
   * Get shared trip by token
   * Backend endpoint: GET /api/shared/:token
   * Response: { trip: Trip, locations: Location[], photos: Photo[], shared_by: User }
   */
  getSharedTrip: async (token: string): Promise<{
    trip: Trip
    locations: Location[]
    photos: Photo[]
    shared_by: User
  }> => {
    // PLACEHOLDER
    console.log('shareAPI.getSharedTrip called with:', token)
    return Promise.resolve({
      trip: {} as Trip,
      locations: [],
      photos: [],
      shared_by: {} as User,
    })
  },

  /**
   * Revoke trip share
   * Backend endpoint: DELETE /api/shared/:shareId
   * Response: { success: boolean }
   */
  revokeShare: async (shareId: string): Promise<void> => {
    // PLACEHOLDER
    console.log('shareAPI.revokeShare called with:', shareId)
    return Promise.resolve()
  },
}

// Export default api instance for custom calls
export default api

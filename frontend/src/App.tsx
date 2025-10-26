import { useState } from 'react'
import { MapView } from '@/components/map'
import { Sidebar, SidebarView } from '@/components/sidebar/Sidebar'
import { SidebarHome } from '@/components/sidebar/SidebarHome'
import { TripListView } from '@/components/sidebar/TripListView'
import { TripDetailView } from '@/components/sidebar/TripDetailView'
import { LocationDetailView } from '@/components/location/LocationDetailView'
import { LocationDetailEdit } from '@/components/location/LocationDetailEdit'
import { UploadModal } from '@/components/upload'
import { usePhotos } from '@/hooks/usePhotos'
import { getLocationWithPhotos } from '@/lib/mockData'
import { locationAPI } from '@/services/api'
import type { Photo, Location, Trip } from '@/types'
import './App.css'

function App() {
  const { photos, loading, setPhotos } = usePhotos()
  const [trips, setTrips] = useState<Trip[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [sidebarView, setSidebarView] = useState<SidebarView>('home')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationPhotos, setLocationPhotos] = useState<Photo[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const handlePhotoClick = (photo: Photo) => {
    console.log('Photo clicked:', photo)

    // Get location with all photos
    if (photo.location_id) {
      const locationWithPhotos = getLocationWithPhotos(photo.location_id)
      if (locationWithPhotos) {
        setSelectedLocation(locationWithPhotos)
        setLocationPhotos(locationWithPhotos.photos || [])
        setSidebarView('location-detail')
        setIsEditing(false)
      }
    }
  }

  const handleBackToHome = () => {
    setSidebarView('home')
    setSelectedTrip(null)
    setSelectedLocation(null)
    setLocationPhotos([])
    setIsEditing(false)
  }

  const handleBackToTripList = () => {
    setSidebarView('trip-list')
    setSelectedTrip(null)
    setSelectedLocation(null)
    setIsEditing(false)
  }

  const handleBackToTripDetail = () => {
    setSidebarView('trip-detail')
    setSelectedLocation(null)
    setIsEditing(false)
  }

  const handleMyTripsClick = () => {
    setSidebarView('trip-list')
  }

  const handleTripClick = (trip: Trip) => {
    console.log('Trip clicked:', trip)
    setSelectedTrip(trip)
    setSidebarView('trip-detail')
  }

  const handleLocationClick = async (location: Location) => {
    console.log('Location clicked:', location)
    const runtime = locations.find(l => l.id === location.id) || location

    // If we already have photos locally, use them; otherwise try API store, then mock
    let enriched = runtime
    if (!runtime.photos || runtime.photos.length === 0) {
      try {
        const fetched = await locationAPI.getLocationById(location.id)
        enriched = { ...fetched.location, photos: fetched.photos }

        // merge back into locations state so Trip views show counts
        setLocations(prev => {
          const byId: Record<string, Location> = {}
          for (const l of [...prev, enriched]) byId[l.id] = { ...(byId[l.id] || {} as Location), ...l }
          return Object.values(byId)
        })
      } catch (e) {
        const fallback = getLocationWithPhotos(location.id)
        if (fallback) enriched = fallback
      }
    }

    setSelectedLocation(enriched)
    setLocationPhotos(enriched.photos || [])
    setSidebarView('location-detail')
    setIsEditing(false)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSaveLocation = (location: Location) => {
    console.log('Saving location:', location)
    // Persist to mock API store and refresh local state
    locationAPI.updateLocation(location).then((updated) => {
      // update local locations state
      setLocations(prev => {
        const idx = prev.findIndex(l => l.id === updated.id)
        if (idx === -1) return [...prev, updated]
        const copy = [...prev]
        copy[idx] = updated
        return copy
      })
      setSelectedLocation(updated)
      setIsEditing(false)

      // Recompute trip stats (avg rating, photo count)
      if (updated.trip_id) {
        const related = locations.filter(l => l.trip_id === updated.trip_id).map(l => l.id === updated.id ? updated : l)
        const rated = related.filter(l => (l.rating ?? 0) > 0)
        const avg = rated.length > 0 ? rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length : 0
        const photosCount = related.reduce((s, l) => s + (l.photos?.length || 0), 0)
        setTrips(prev => prev.map(t => t.id === updated.trip_id ? { ...t, rating: avg || undefined, photo_count: photosCount } : t))
      }
    })
  }

  const handleUploadClick = () => {
    console.log('Upload clicked - opening modal')
    setIsUploadModalOpen(true)
    console.log('Modal state set to:', true)
  }

  const handleUploadComplete = (trip?: Trip, newLocations?: Location[]) => {
    console.log('Upload completed:', { trip, locations: newLocations })

    if (trip) {
      setTrips(prevTrips => [...prevTrips, trip])
      console.log('Added new trip to trips list:', trip)
    }

    if (newLocations && newLocations.length > 0) {
      console.log('Adding locations to state and map:', newLocations)
      // merge locations (preserve existing ones under the trip)
      setLocations(prev => {
        const byId: Record<string, Location> = {}
        for (const l of [...prev, ...newLocations]) {
          byId[l.id] = { ...(byId[l.id] || {} as Location), ...l }
        }
        return Object.values(byId)
      })

      // add their photos to the map
      setPhotos(prevPhotos => {
        const newPhotos = newLocations.flatMap(location =>
          location.photos?.map(photo => ({
            ...photo,
            location: location
          })) || []
        )
        console.log('New photos to add:', newPhotos)
        return [...prevPhotos, ...newPhotos]
      })

      // compute trip stats across ALL locations for that trip
      if (trip) {
        setTrips(prev => {
          const allForTrip = (locations.filter(l => l.trip_id === trip.id)).concat(newLocations)
          const dedupById: Record<string, Location> = {}
          for (const l of allForTrip) dedupById[l.id] = l
          const merged = Object.values(dedupById)
          const rated = merged.filter(l => (l.rating ?? 0) > 0)
          const avg = rated.length > 0 ? rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length : 0
          const photosCount = merged.reduce((s, l) => s + (l.photos?.length || 0), 0)
          return prev.map(t => t.id === trip.id ? { ...t, rating: avg || undefined, photo_count: photosCount } : t)
        })
      }

      // Navigate author to edit the first created location
      if (trip) {
        const first = newLocations[0]
        if (first) {
          setSelectedTrip(trip)
          setSelectedLocation(first)
          setLocationPhotos(first.photos || [])
          setIsEditing(true)
          setSidebarView('location-detail')
        }
      }
    }

    // Force a refresh to ensure the UI updates
    setTimeout(() => {
      console.log('Forcing UI refresh...')
      setTrips(prevTrips => [...prevTrips])
      setPhotos(prevPhotos => [...prevPhotos])
    }, 100)

    setIsUploadModalOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading photos...</p>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex">
      {/* Sidebar */}
      <Sidebar view={sidebarView}>
        {sidebarView === 'home' && (
          <SidebarHome
            onTripClick={handleTripClick}
            onUploadClick={handleUploadClick}
            onMyTripsClick={handleMyTripsClick}
            trips={trips}
          />
        )}

        {sidebarView === 'trip-list' && (
          <TripListView onBack={handleBackToHome} onTripClick={handleTripClick} trips={trips} />
        )}

        {sidebarView === 'trip-detail' && selectedTrip && (
          <TripDetailView
            trip={selectedTrip}
            locations={locations}
            onBack={handleBackToTripList}
            onLocationClick={handleLocationClick}
          />
        )}

        {sidebarView === 'location-detail' && selectedLocation && (
          isEditing ? (
            <LocationDetailEdit
              location={selectedLocation}
              photos={locationPhotos}
              onCancel={handleCancelEdit}
              onSave={handleSaveLocation}
            />
          ) : (
            <LocationDetailView
              location={selectedLocation}
              photos={locationPhotos}
              onBack={selectedTrip ? handleBackToTripDetail : handleBackToHome}
              onEdit={handleEditClick}
            />
          )
        )}
      </Sidebar>

      {/* Map - offset by sidebar width */}
      <div className="flex-1" style={{ marginLeft: sidebarView === 'location-detail' ? '400px' : '360px' }}>
        <MapView photos={photos} onPhotoClick={handlePhotoClick} enableClustering={false} />
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}

export default App

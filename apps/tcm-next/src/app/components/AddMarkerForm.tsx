'use client'

import { useState } from 'react'
import { trpc } from '../../lib/trpc/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface AddMarkerFormProps {
  onMarkerAdded?: () => void
}

export function AddMarkerForm({ onMarkerAdded }: AddMarkerFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [distanceKm, setDistanceKm] = useState('')

  const createMarker = trpc.marker.create.useMutation({
    onSuccess: () => {
      setName('')
      setDescription('')
      setLatitude('')
      setLongitude('')
      setDistanceKm('')
      onMarkerAdded?.()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    const distance = parseFloat(distanceKm)

    if (isNaN(lat) || isNaN(lng) || isNaN(distance)) {
      alert('Please enter valid numbers for coordinates and distance')
      return
    }

    createMarker.mutate({
      name,
      description: description || undefined,
      latitude: lat,
      longitude: lng,
      distanceKm: distance
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add Marathon Marker</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Marker Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mile 5 Aid Station"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this marker..."
            />
          </div>

          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="44.9778"
              required
            />
          </div>

          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-93.2650"
              required
            />
          </div>

          <div>
            <Label htmlFor="distance">Distance (km)</Label>
            <Input
              id="distance"
              type="number"
              step="0.1"
              min="0"
              max="42.2"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="5.0"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createMarker.isPending}
          >
            {createMarker.isPending ? 'Adding...' : 'Add Marker'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
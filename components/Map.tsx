"use client";

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsService, Marker, Polyline } from '@react-google-maps/api';
import { Track } from '@/app/page';
import VibeTooltip from './VibeTooltip';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 38.9072,
  lng: -77.0369
};

const VIBE_COLORS = [
  '#1DB954', // Spotify Green
  '#00D1FF', // Blue
];

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

const pinIcon = (color: string) => ({
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: color,
  fillOpacity: 1,
  strokeWeight: 1.5,
  strokeColor: "#FFFFFF",
  scale: 1.5,
  anchor: { x: 12, y: 22 }
} as google.maps.Symbol);

interface MapProps {
  origin: string;
  destination: string;
  tripSongs: Track[];
}

export default function Map({ 
  origin, destination, tripSongs
}: MapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [fullPath, setFullPath] = useState<google.maps.LatLng[]>([]);
  const [hoveredSong, setHoveredSong] = useState<{ track: Track, pos: { x: number, y: number } } | null>(null);

  const routeKey = useMemo(() => `${origin}-${destination}`, [origin, destination]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['geometry']
  });

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  useEffect(() => {
    setResponse(null);
    setFullPath([]);
    setHoveredSong(null);
  }, [routeKey]);

  const directionsCallback = useCallback((res: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (res !== null && status === 'OK') {
      setResponse(res);
      const path = res.routes[0].overview_path;
      setFullPath(path);

      // Fit map to show entire route
      if (map && path.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        path.forEach(pt => bounds.extend(pt));
        map.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        });
      }
    }
  }, [map]);

  const songPaths = useMemo(() => {
    if (!response || !tripSongs.length || !isLoaded || !fullPath.length) return [];
    
    const route = response.routes[0];
    const totalDurationSec = route.legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);
    const totalDistanceMeters = google.maps.geometry.spherical.computeLength(fullPath);
    const averageSpeedMps = totalDistanceMeters / totalDurationSec;

    let pathIndex = 0;
    let currentStartPoint = fullPath[0];

    return tripSongs.map((track, idx) => {
      const songDurationSec = track.durationMs / 1000;
      const songDistanceMeters = songDurationSec * averageSpeedMps;
      
      const segmentPath: google.maps.LatLng[] = [currentStartPoint];
      let segmentDistance = 0;

      while (segmentDistance < songDistanceMeters && pathIndex < fullPath.length - 1) {
        const p1 = segmentPath[segmentPath.length - 1];
        const p2 = fullPath[pathIndex + 1];
        const stepDist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
        
        if (segmentDistance + stepDist > songDistanceMeters) {
          const neededDist = songDistanceMeters - segmentDistance;
          const fraction = neededDist / stepDist;
          const interpolated = google.maps.geometry.spherical.interpolate(p1, p2, fraction);
          segmentPath.push(interpolated);
          
          segmentDistance = songDistanceMeters;
          currentStartPoint = interpolated;
        } else {
          segmentPath.push(p2);
          segmentDistance += stepDist;
          pathIndex++;
          currentStartPoint = p2;
        }
      }

      if (segmentPath.length < 2) return null;

      return {
        id: `${track.id}-${idx}-${routeKey}`,
        path: segmentPath,
        track: track,
        color: VIBE_COLORS[idx % VIBE_COLORS.length]
      };
    }).filter(Boolean) as any[];
  }, [response, tripSongs, isLoaded, fullPath, routeKey]);

  const directionsServiceOptions = useMemo<google.maps.DirectionsRequest | null>(() => {
    if (!origin || !destination) return null;
    return {
      destination: destination,
      origin: origin,
      travelMode: "DRIVING" as google.maps.TravelMode
    };
  }, [origin, destination]); 

  const mapOptions = useMemo(() => ({
    styles: darkMapStyle,
    disableDefaultUI: false,
    zoomControl: true,
    clickableIcons: false,
  }), []);

  if (!isLoaded) return <div style={{ height: '100%', width: '100%', background: '#121212' }} />;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <GoogleMap
        key={routeKey}
        mapContainerStyle={containerStyle}
        center={center}
        zoom={6}
        options={mapOptions}
        onLoad={onMapLoad}
        onClick={() => setHoveredSong(null)}
      >
        {!response && directionsServiceOptions && (
          <DirectionsService
            options={directionsServiceOptions}
            callback={directionsCallback}
          />
        )}

        {fullPath.length > 0 && (
          <Polyline
            key={`base-route-${routeKey}`}
            path={fullPath}
            options={{
              strokeColor: '#333',
              strokeOpacity: 0.3,
              strokeWeight: 4,
            }}
          />
        )}

        {songPaths.map(sp => (
          <React.Fragment key={sp.id}>
            <Polyline
              path={sp.path}
              options={{
                strokeColor: sp.color,
                strokeOpacity: 0.15,
                strokeWeight: 14,
                zIndex: 9
              }}
            />
            <Polyline
              path={sp.path}
              onMouseMove={(e) => {
                if (e.domEvent) {
                  setHoveredSong({ 
                    track: sp.track, 
                    pos: { x: (e.domEvent as MouseEvent).clientX, y: (e.domEvent as MouseEvent).clientY } 
                  });
                }
              }}
              onMouseOut={() => setHoveredSong(null)}
              onClick={(e) => {
                if (e.domEvent) {
                  const x = (e.domEvent as any).clientX || (e.domEvent as any).touches?.[0]?.clientX;
                  const y = (e.domEvent as any).clientY || (e.domEvent as any).touches?.[0]?.clientY;
                  if (x && y) {
                    setHoveredSong({ 
                      track: sp.track, 
                      pos: { x, y } 
                    });
                  }
                }
              }}
              options={{
                strokeColor: sp.color,
                strokeOpacity: 1.0,
                strokeWeight: 7,
                zIndex: 10
              }}
            />
          </React.Fragment>
        ))}

        {hoveredSong && <VibeTooltip track={hoveredSong.track} pos={hoveredSong.pos} />}

        {fullPath.length > 0 && (
          <>
            <Marker 
              key={`marker-a-${routeKey}`} 
              position={fullPath[0]} 
              icon={pinIcon("#FFFFFF")}
              title="Start"
            />
            <Marker 
              key={`marker-b-${routeKey}`} 
              position={fullPath[fullPath.length - 1]} 
              icon={pinIcon("#1DB954")}
              title="End"
            />
          </>
        )}
      </GoogleMap>
    </div>
  );
}

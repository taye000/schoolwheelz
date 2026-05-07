import React, { useEffect, useState } from "react";
import MapboxMap, {
  Marker,
  NavigationControl,
  GeolocateControl,
  MapMouseEvent,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import styled from "styled-components";
import { colors } from "@/lib/theme";
import LocationPermissionPrompt from "./LocationPermissionPrompt";

// Google Maps is preserved for future search/autocomplete integration.
// Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local when needed.

const MapContainer = styled.div`
  flex: 1;
  height: 100%;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
`;

interface MapProps {
  mode: "register" | "profile";
  driverLocation?: { lat: number; lng: number };
  onLocationsChange?: (locations: {
    pickupLocation: { lat: number; lng: number };
    dropoffLocation: { lat: number; lng: number };
  }) => void;
}

const Map: React.FC<MapProps> = ({ mode, driverLocation, onLocationsChange }) => {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const [viewState, setViewState] = useState({
    longitude: driverLocation?.lng ?? 0,
    latitude: driverLocation?.lat ?? 0,
    zoom: 13,
  });

  const [locations, setLocations] = useState({
    pickupLocation: { lat: 0, lng: 0 },
    dropoffLocation: { lat: 0, lng: 0 },
  });
  const [markerCount, setMarkerCount] = useState(0);
  const [geoReady, setGeoReady] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

  const handleLocationGranted = (coords: GeolocationCoordinates) => {
    const pos = { lat: coords.latitude, lng: coords.longitude };
    setLocations({ pickupLocation: pos, dropoffLocation: pos });
    setViewState((v) => ({ ...v, longitude: pos.lng, latitude: pos.lat }));
    setGeoReady(true);
    setShowLocationPrompt(false);
  };

  const handleLocationDismiss = () => {
    setGeoReady(true);
    setShowLocationPrompt(false);
  };

  useEffect(() => {
    if (driverLocation && mode === "profile") {
      setViewState((v) => ({
        ...v,
        longitude: driverLocation.lng,
        latitude: driverLocation.lat,
      }));
    }
  }, [driverLocation, mode]);

  if (!mapboxToken) {
    return (
      <MapContainer style={{ display: "flex", alignItems: "center", justifyContent: "center", background: colors.lightBg }}>
        <p style={{ color: colors.mutedText, fontSize: "0.875rem", textAlign: "center", padding: "24px" }}>
          Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> in your <code>.env.local</code> to enable the map.
        </p>
      </MapContainer>
    );
  }

  const handleMapClick = (e: MapMouseEvent) => {
    if (mode !== "register") return;
    const { lng, lat } = e.lngLat;

    let newLocations = { ...locations };
    if (markerCount === 0) {
      newLocations.pickupLocation = { lat, lng };
      setMarkerCount(1);
    } else if (markerCount === 1) {
      newLocations.dropoffLocation = { lat, lng };
      setMarkerCount(2);
    } else {
      // Reset cycle — start again from pickup
      newLocations.pickupLocation = { lat, lng };
      setMarkerCount(1);
    }
    setLocations(newLocations);
    onLocationsChange?.(newLocations);
  };

  const center = mode === "profile" && driverLocation
    ? { lng: driverLocation.lng, lat: driverLocation.lat }
    : { lng: viewState.longitude, lat: viewState.latitude };

  return (
    <>
      {showLocationPrompt && (
        <LocationPermissionPrompt
          onGranted={handleLocationGranted}
          onDismiss={handleLocationDismiss}
        />
      )}
      <MapContainer>
      <MapboxMap
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" trackUserLocation />

        {/* Pickup marker (green) */}
        {mode === "register" && locations.pickupLocation.lat !== 0 && (
          <Marker
            longitude={locations.pickupLocation.lng}
            latitude={locations.pickupLocation.lat}
            draggable
            onDragEnd={(e) => {
              const updated = { ...locations, pickupLocation: { lat: e.lngLat.lat, lng: e.lngLat.lng } };
              setLocations(updated);
              onLocationsChange?.(updated);
            }}
            color={colors.mintCream}
          />
        )}

        {/* Dropoff marker (sky blue) */}
        {mode === "register" && locations.dropoffLocation.lat !== 0 && markerCount >= 2 && (
          <Marker
            longitude={locations.dropoffLocation.lng}
            latitude={locations.dropoffLocation.lat}
            draggable
            onDragEnd={(e) => {
              const updated = { ...locations, dropoffLocation: { lat: e.lngLat.lat, lng: e.lngLat.lng } };
              setLocations(updated);
              onLocationsChange?.(updated);
            }}
            color={colors.skyBlue}
          />
        )}

        {/* Driver / profile marker */}
        {mode === "profile" && driverLocation && (
          <Marker
            longitude={driverLocation.lng}
            latitude={driverLocation.lat}
            color={colors.skyBlue}
          />
        )}
      </MapboxMap>

      {mode === "register" && (
        <MapHint>
          {markerCount === 0 && "Click to set pick-up location"}
          {markerCount === 1 && "Click to set drop-off location"}
          {markerCount >= 2 && "Drag markers to adjust • Click to reset"}
        </MapHint>
      )}
    </MapContainer>
    </>
  );
};

const MapHint = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(26, 54, 93, 0.88);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 50px;
  backdrop-filter: blur(8px);
  pointer-events: none;
  white-space: nowrap;
`;

export default Map;


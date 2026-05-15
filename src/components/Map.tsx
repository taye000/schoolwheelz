"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import MapboxMap, {
  Marker,
  NavigationControl,
  GeolocateControl,
  MapMouseEvent,
  MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import styled from "styled-components";
import { colors } from "@/lib/theme";
import LocationPermissionPrompt from "./LocationPermissionPrompt";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeoFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

interface MapProps {
  mode: "register" | "profile";
  driverLocation?: { lat: number; lng: number };
  onLocationsChange?: (locations: {
    pickupLocation: { lat: number; lng: number };
    dropoffLocation: { lat: number; lng: number };
  }) => void;
}

// Default map center — Nairobi, Kenya
const NAIROBI = { lat: -1.2921, lng: 36.8219 };
const DEFAULT_ZOOM = 12;

// ─── Component ───────────────────────────────────────────────────────────────

const Map: React.FC<MapProps> = ({ mode, driverLocation, onLocationsChange }) => {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);

  const [viewState, setViewState] = useState({
    longitude: driverLocation?.lng ?? NAIROBI.lng,
    latitude: driverLocation?.lat ?? NAIROBI.lat,
    zoom: DEFAULT_ZOOM,
  });

  const [locations, setLocations] = useState({
    pickupLocation: { lat: 0, lng: 0 },
    dropoffLocation: { lat: 0, lng: 0 },
  });
  const [markerCount, setMarkerCount] = useState(0);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

  // Search state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoFeature[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Geocoding ───────────────────────────────────────────────────────────────

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (!mapboxToken || q.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setSearchLoading(true);
      try {
        const encoded = encodeURIComponent(q.trim());
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${mapboxToken}&country=ke&types=place,address,poi,neighborhood&limit=5&language=en`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.features ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [mapboxToken]
  );

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
  };

  const handleSelectSuggestion = (feature: GeoFeature) => {
    const [lng, lat] = feature.center;
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 900 });
    setQuery(feature.place_name);
    setSuggestions([]);
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
  };

  // ── Location prompt ─────────────────────────────────────────────────────────

  const handleLocationGranted = (coords: GeolocationCoordinates) => {
    const pos = { lat: coords.latitude, lng: coords.longitude };
    setLocations({ pickupLocation: pos, dropoffLocation: pos });
    setViewState((v) => ({ ...v, longitude: pos.lng, latitude: pos.lat }));
    setShowLocationPrompt(false);
  };

  const handleLocationDismiss = () => setShowLocationPrompt(false);

  useEffect(() => {
    if (driverLocation && mode === "profile") {
      setViewState((v) => ({
        ...v,
        longitude: driverLocation.lng,
        latitude: driverLocation.lat,
      }));
    }
  }, [driverLocation, mode]);

  // ── Map click ───────────────────────────────────────────────────────────────

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
      newLocations.pickupLocation = { lat, lng };
      newLocations.dropoffLocation = { lat: 0, lng: 0 };
      setMarkerCount(1);
    }
    setLocations(newLocations);
    onLocationsChange?.(newLocations);
  };

  // ── No token guard ──────────────────────────────────────────────────────────

  if (!mapboxToken) {
    return (
      <MapContainer style={{ display: "flex", alignItems: "center", justifyContent: "center", background: colors.lightBg }}>
        <p style={{ color: colors.mutedText, fontSize: "0.875rem", textAlign: "center", padding: "24px" }}>
          Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> in <code>.env.local</code> to enable the map.
        </p>
      </MapContainer>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {showLocationPrompt && (
        <LocationPermissionPrompt
          onGranted={handleLocationGranted}
          onDismiss={handleLocationDismiss}
        />
      )}

      <MapContainer>
        {/* ── Search overlay (register mode only) ── */}
        {mode === "register" && (
          <SearchOverlay>
            <SearchInputWrap>
              <SearchIcon>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search school, apartment, area…"
                value={query}
                onChange={handleSearchInput}
                onKeyDown={(e) => e.key === "Escape" && clearSearch()}
              />
              {query && (
                <ClearBtn onClick={clearSearch} aria-label="Clear search">
                  ×
                </ClearBtn>
              )}
              {searchLoading && <Spinner />}
            </SearchInputWrap>

            {suggestions.length > 0 && (
              <SuggestionList>
                {suggestions.map((f) => (
                  <SuggestionItem key={f.id} onClick={() => handleSelectSuggestion(f)}>
                    <PinIcon>📍</PinIcon>
                    <span>{f.place_name}</span>
                  </SuggestionItem>
                ))}
              </SuggestionList>
            )}
          </SearchOverlay>
        )}

        <MapboxMap
          ref={mapRef}
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          onClick={handleMapClick}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={mapboxToken}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />
          <GeolocateControl position="top-right" trackUserLocation />

          {/* Pickup marker (mint green) */}
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
            <Marker longitude={driverLocation.lng} latitude={driverLocation.lat} color={colors.skyBlue} />
          )}
        </MapboxMap>

        {mode === "register" && (
          <MapHint>
            {markerCount === 0 && "Search above, then click to set pick-up"}
            {markerCount === 1 && "Click to set drop-off location"}
            {markerCount >= 2 && "Drag markers to adjust · Click to reset"}
          </MapHint>
        )}
      </MapContainer>
    </>
  );
};

export default Map;

// ─── Styles ───────────────────────────────────────────────────────────────────

const MapContainer = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
`;

const SearchOverlay = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  width: min(320px, calc(100% - 100px));
  font-family: inherit;
`;

const SearchInputWrap = styled.div`
  display: flex;
  align-items: center;
  background: ${colors.pureWhite};
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(26, 54, 93, 0.18);
  padding: 0 10px;
  height: 40px;
  gap: 6px;
`;

const SearchIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${colors.mutedText};
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.82rem;
  color: ${colors.slateCharcoal};
  background: transparent;
  min-width: 0;

  &::placeholder {
    color: ${colors.mutedText};
  }
`;

const ClearBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.mutedText};
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 2px;
  flex-shrink: 0;

  &:hover {
    color: ${colors.slateCharcoal};
  }
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid ${colors.border};
  border-top-color: ${colors.skyBlue};
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SuggestionList = styled.ul`
  margin: 4px 0 0;
  padding: 4px 0;
  list-style: none;
  background: ${colors.pureWhite};
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(26, 54, 93, 0.16);
  max-height: 220px;
  overflow-y: auto;
`;

const SuggestionItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 14px;
  cursor: pointer;
  font-size: 0.8rem;
  color: ${colors.slateCharcoal};
  line-height: 1.4;
  transition: background 0.12s;

  &:hover {
    background: ${colors.lightBg};
  }
`;

const PinIcon = styled.span`
  flex-shrink: 0;
  font-size: 0.85rem;
  margin-top: 1px;
`;

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

"use client";

import React, { useEffect, useState } from "react";
import MapboxMap, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import styled from "styled-components";
import axios from "axios";
import { colors } from "@/lib/theme";

interface Props {
  bookingId: string;
  /** Initial coords from the loaded booking (may be [0,0] if not yet set) */
  initialCoords?: [number, number]; // [lng, lat]
}

const NAIROBI: [number, number] = [36.8219, -1.2921];
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export default function TripTrackingMap({ bookingId, initialCoords }: Props) {
  const [coords, setCoords] = useState<[number, number] | null>(
    initialCoords && initialCoords[0] !== 0 ? initialCoords : null,
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Poll every 10 s for updated driver location
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await axios.get(`/api/bookings?id=${bookingId}`, { withCredentials: true });
        if (!res.data.success) return;
        const b = res.data.data;
        const c: [number, number] | undefined = b?.tracking?.currentLocation?.coordinates;
        if (c && c[0] !== 0) {
          setCoords(c);
          setLastUpdated(b.tracking.lastUpdated ? new Date(b.tracking.lastUpdated) : null);
        }
        // Stop polling if trip ended
        if (b.status !== "in_progress") clearInterval(timer);
      } catch {}
    };

    const timer = setInterval(poll, 10_000);
    poll(); // immediate first fetch
    return () => clearInterval(timer);
  }, [bookingId]);

  const center: [number, number] = coords ?? NAIROBI;
  const hasLocation = coords !== null;

  return (
    <Wrap>
      <MapHeader>
        <MapTitle>Live Location</MapTitle>
        {lastUpdated && (
          <MapSub>Updated {Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago</MapSub>
        )}
        {!hasLocation && <MapSub>Waiting for driver location…</MapSub>}
      </MapHeader>
      <MapWrap>
        <MapboxMap
          mapboxAccessToken={TOKEN}
          initialViewState={{ longitude: center[0], latitude: center[1], zoom: 14 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          <NavigationControl position="top-right" />
          {hasLocation && (
            <Marker longitude={coords![0]} latitude={coords![1]} anchor="bottom">
              <DriverPin title="Driver location">🚐</DriverPin>
            </Marker>
          )}
        </MapboxMap>
      </MapWrap>
    </Wrap>
  );
}

const Wrap = styled.div`
  border: 1px solid ${colors.border}; border-radius: 16px; overflow: hidden;
`;

const MapHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; background: ${colors.lightBg};
  border-bottom: 1px solid ${colors.border};
`;

const MapTitle = styled.p`
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; color: ${colors.deepNavy}; margin: 0;
`;

const MapSub = styled.p`
  font-size: 0.75rem; color: ${colors.mutedText}; margin: 0;
`;

const MapWrap = styled.div`
  height: 260px;
`;

const DriverPin = styled.div`
  font-size: 28px; cursor: default;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
`;

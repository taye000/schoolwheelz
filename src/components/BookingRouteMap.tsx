"use client";

/**
 * BookingRouteMap — shows pickup & drop-off pins for all children in a booking.
 * Used in the booking detail page so a driver can review the route before accepting.
 */
import React, { useMemo } from "react";
import MapboxMap, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import styled from "styled-components";
import { Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SchoolIcon from "@mui/icons-material/School";
import { colors } from "@/lib/theme";

interface ChildPoint {
  name: string;
  school: string;
  pickupLocation?: { lat: number; lng: number };
  dropoffLocation?: { lat: number; lng: number };
}

interface Props {
  children: ChildPoint[];
  direction: "morning" | "evening" | "both";
}

const NAIROBI: [number, number] = [36.8219, -1.2921]; // fallback center
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

function midpoint(points: [number, number][]): [number, number] {
  if (!points.length) return NAIROBI;
  const lng = points.reduce((a, p) => a + p[0], 0) / points.length;
  const lat = points.reduce((a, p) => a + p[1], 0) / points.length;
  return [lng, lat];
}

export default function BookingRouteMap({ children, direction }: Props) {
  const pickupPins: { name: string; school: string; lng: number; lat: number }[] = [];
  const dropoffPins: { name: string; school: string; lng: number; lat: number }[] = [];

  children.forEach((c) => {
    if (c.pickupLocation?.lat && c.pickupLocation?.lng) {
      pickupPins.push({ name: c.name, school: c.school, lng: c.pickupLocation.lng, lat: c.pickupLocation.lat });
    }
    if (c.dropoffLocation?.lat && c.dropoffLocation?.lng) {
      dropoffPins.push({ name: c.name, school: c.school, lng: c.dropoffLocation.lng, lat: c.dropoffLocation.lat });
    }
  });

  const allPoints: [number, number][] = [
    ...pickupPins.map((p): [number, number] => [p.lng, p.lat]),
    ...dropoffPins.map((p): [number, number] => [p.lng, p.lat]),
  ];

  const center = useMemo(() => midpoint(allPoints), [allPoints.length]);
  const hasAnyPin = allPoints.length > 0;

  const showPickup = direction === "morning" || direction === "both";
  const showDropoff = direction === "evening" || direction === "both";

  if (!hasAnyPin || !TOKEN) return null;

  return (
    <Wrap>
      <MapHeader>
        <MapTitle>Route Preview</MapTitle>
        <Legend>
          {showPickup && <span style={{ fontSize: 14 }}>🏠</span>}
          {showPickup && <LegendLabel>Pick-up</LegendLabel>}
          {showDropoff && <span style={{ fontSize: 14 }}>🏫</span>}
          {showDropoff && <LegendLabel>Drop-off / School</LegendLabel>}
        </Legend>
      </MapHeader>
      <MapWrap>
        <MapboxMap
          mapboxAccessToken={TOKEN}
          initialViewState={{ longitude: center[0], latitude: center[1], zoom: 13 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          <NavigationControl position="top-right" />

          {showPickup && pickupPins.map((p, i) => (
            <Marker key={`pickup-${i}`} longitude={p.lng} latitude={p.lat} anchor="bottom">
              <PinWrap color={colors.successGreen} title={`Pickup: ${p.name}`}>
                🏠
              </PinWrap>
            </Marker>
          ))}

          {showDropoff && dropoffPins.map((p, i) => (
            <Marker key={`dropoff-${i}`} longitude={p.lng} latitude={p.lat} anchor="bottom">
              <PinWrap color={colors.skyBlue} title={`School / Drop-off: ${p.name} — ${p.school}`}>
                🏫
              </PinWrap>
            </Marker>
          ))}
        </MapboxMap>
      </MapWrap>
    </Wrap>
  );
}

// ── Styled ────────────────────────────────────────────────────────────────────
const Wrap = styled.div`
  border: 1px solid ${colors.border};
  border-radius: 14px;
  overflow: hidden;
  margin-top: 16px;
`;

const MapHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${colors.lightBg};
  border-bottom: 1px solid ${colors.border};
`;

const MapTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${colors.deepNavy};
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LegendLabel = styled.span`
  font-size: 0.75rem;
  color: ${colors.mutedText};
  margin-right: 8px;
`;

const MapWrap = styled.div`
  height: 280px;
`;

const PinWrap = styled.div<{ color?: string }>`
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  cursor: default;
`;

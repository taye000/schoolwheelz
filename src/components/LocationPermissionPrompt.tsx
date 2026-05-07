"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { colors } from "@/lib/theme";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CloseIcon from "@mui/icons-material/Close";

type PermissionStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

interface LocationPermissionPromptProps {
  /** Called when permission is granted with the user's coordinates */
  onGranted?: (coords: GeolocationCoordinates) => void;
  /** Called when the user dismisses or denies */
  onDismiss?: () => void;
  /** If true, the prompt is shown immediately without waiting for a trigger */
  autoShow?: boolean;
}

/* ── Animations ── */
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;
const pulse = keyframes`0%,100% { transform: scale(1); } 50% { transform: scale(1.12); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

/* ── Styled components ── */
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(26, 54, 93, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: ${fadeIn} 0.25s ease;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 40px 36px 32px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 24px 64px rgba(26, 54, 93, 0.25);
  position: relative;
  animation: ${slideUp} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: center;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  background: ${colors.lightBg};
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.mutedText};
  transition: background 0.2s;
  &:hover { background: ${colors.border}; }
`;

const IconWrapper = styled.div<{ status: PermissionStatus }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 36px;
  background: ${({ status }) =>
    status === "denied" ? "#FED7D7" : `linear-gradient(135deg, ${colors.deepNavy}, ${colors.skyBlue})`};
  color: ${({ status }) => (status === "denied" ? "#C53030" : "#fff")};
  animation: ${({ status }) => (status === "requesting" ? spin : pulse)} 
    ${({ status }) => (status === "requesting" ? "1s linear infinite" : "3s ease-in-out infinite")};
`;

const Title = styled.h2`
  font-size: 1.35rem;
  font-weight: 700;
  color: ${colors.deepNavy};
  margin: 0 0 8px;
`;

const Body = styled.p`
  font-size: 0.925rem;
  color: ${colors.mutedText};
  line-height: 1.6;
  margin: 0 0 28px;
`;

const Reason = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 28px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ReasonItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.875rem;
  color: ${colors.slateCharcoal};

  span.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${colors.mintCream};
    flex-shrink: 0;
  }
`;

const AllowBtn = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, ${colors.deepNavy} 0%, ${colors.skyBlue} 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  &:hover { opacity: 0.9; }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const DenyBtn = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: ${colors.mutedText};
  font-size: 0.875rem;
  cursor: pointer;
  margin-top: 8px;
  transition: color 0.2s;
  &:hover { color: ${colors.slateCharcoal}; }
`;

const DeniedNote = styled.p`
  font-size: 0.8rem;
  color: #C53030;
  margin-top: 16px;
  line-height: 1.5;
`;

/* ── Component ── */
export default function LocationPermissionPrompt({
  onGranted,
  onDismiss,
  autoShow = true,
}: LocationPermissionPromptProps) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<PermissionStatus>("idle");

  useEffect(() => {
    if (!autoShow) return;

    // Don't show if already granted previously
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "granted") {
          // Already have permission — silently get coords and call back
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => onGranted?.(coords),
            () => {}
          );
        } else if (result.state === "prompt") {
          // Show our prompt UI before the browser asks
          setVisible(true);
        } else {
          // "denied" — show the prompt with the denied state so user knows what to do
          setStatus("denied");
          setVisible(true);
        }
      })
      .catch(() => {
        // Permissions API not available — show prompt anyway
        setVisible(true);
      });
  }, [autoShow]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAllow = () => {
    if (status === "denied") return;
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setStatus("granted");
        setTimeout(() => {
          setVisible(false);
          onGranted?.(coords);
        }, 600);
      },
      () => {
        setStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  const isDenied = status === "denied";
  const isRequesting = status === "requesting";
  const isGranted = status === "granted";

  return (
    <Backdrop onClick={(e) => e.target === e.currentTarget && handleDismiss()}>
      <Card>
        {!isRequesting && !isGranted && (
          <CloseBtn onClick={handleDismiss} aria-label="Close">
            <CloseIcon fontSize="small" />
          </CloseBtn>
        )}

        <IconWrapper status={isDenied ? "denied" : status}>
          <MyLocationIcon fontSize="inherit" />
        </IconWrapper>

        <Title>
          {isGranted
            ? "Location Found!"
            : isDenied
            ? "Location Blocked"
            : "Allow Location Access"}
        </Title>

        <Body>
          {isGranted
            ? "Your location has been found. Setting up your map…"
            : isDenied
            ? "Location access was denied. To use the map features, please enable location in your browser settings."
            : "School Wheelz needs your location to show nearby drivers and set accurate pickup and drop-off points."}
        </Body>

        {!isDenied && !isGranted && !isRequesting && (
          <Reason>
            <ReasonItem>
              <span className="dot" />
              Show drivers near your area
            </ReasonItem>
            <ReasonItem>
              <span className="dot" />
              Auto-fill your pickup location on the map
            </ReasonItem>
            <ReasonItem>
              <span className="dot" />
              Track your child's route in real time
            </ReasonItem>
          </Reason>
        )}

        {isDenied ? (
          <>
            <DeniedNote>
              In your browser, go to <strong>Settings → Privacy → Location</strong> and
              allow access for this site, then reload the page.
            </DeniedNote>
            <DenyBtn onClick={handleDismiss} style={{ marginTop: 20 }}>
              Got it
            </DenyBtn>
          </>
        ) : !isGranted ? (
          <>
            <AllowBtn onClick={handleAllow} disabled={isRequesting}>
              {isRequesting ? "Locating…" : "Allow Location Access"}
            </AllowBtn>
            <DenyBtn onClick={handleDismiss}>Not now</DenyBtn>
          </>
        ) : null}
      </Card>
    </Backdrop>
  );
}

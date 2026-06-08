"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import { Avatar } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import RouteIcon from "@mui/icons-material/Route";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import Link from "next/link";
import { colors } from "@/lib/theme";

export interface DriverProfile {
  _id: string;
  photo: string;
  fullName: string;
  phoneNumber: string;
  sex: string;
  dob: string;
  /** Flat car fields — populated from the active car before passing to this component */
  carRegNumber: string;
  carModel: string;
  carMake?: string;
  carColor?: string;
  carYear?: number;
  carPhoto: string;
  /** Raw cars array from API — used to derive flat car fields if needed */
  cars?: { make: string; model: string; regNumber: string; availableSeats: number; isActive: boolean; color?: string; year?: number; photo?: string }[];
  availableSeats?: number;
  rating?: number;
  averageRating?: number;
  verificationStatus?: string;
  completedTrips?: number;
  totalTrips?: number;
  ratingCount?: number;
  estate?: string;
  schools?: { _id: string; name: string; estate: string }[];
}

const ProfileCard: React.FC<DriverProfile> = ({
  _id,
  photo,
  fullName,
  dob,
  carRegNumber,
  carModel,
  carMake,
  carColor,
  carYear,
  cars,
  availableSeats,
  rating,
  averageRating,
  verificationStatus,
  completedTrips,
  totalTrips,
  ratingCount,
  estate,
  schools,
}) => {
  const displayRating = averageRating ?? rating ?? 0;
  const isApproved = verificationStatus === "approved" || !verificationStatus;
  const visibleSchools = schools?.slice(0, 3) ?? [];
  const extraSchools = (schools?.length ?? 0) - visibleSchools.length;
  const age = dob
    ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Resolve active car — prefer flat props (already mapped), fall back to cars array
  const activeCar = cars?.find((c) => c.isActive) ?? cars?.[0];
  const resolvedMake    = carMake    ?? activeCar?.make;
  const resolvedModel   = carModel   ?? activeCar?.model   ?? "";
  const resolvedReg     = carRegNumber ?? activeCar?.regNumber ?? "";
  const resolvedSeats   = availableSeats ?? activeCar?.availableSeats;
  const resolvedColor   = carColor   ?? activeCar?.color;
  const resolvedYear    = carYear    ?? activeCar?.year;

  return (
    <Link href={`/drivers/${_id}`} style={{ textDecoration: "none" }}>
      <Card>
        <TopSection>
          <Avatar
            src={photo}
            alt={fullName}
            sx={{ width: 52, height: 52, bgcolor: colors.deepNavy, fontSize: "1.1rem", flexShrink: 0 }}
          >
            {fullName?.[0]}
          </Avatar>

          <Info>
            <TopRow>
              <FullName>{fullName}</FullName>
              {isApproved && <VerifiedDot title="Verified driver" />}
            </TopRow>
            <MetaRow>
              <MetaItem>
                <DirectionsCarIcon sx={{ fontSize: 14, color: colors.mutedText }} />
                <span>
                  {[resolvedMake, resolvedModel].filter(Boolean).join(" ") || "Vehicle"}
                  {resolvedYear ? ` (${resolvedYear})` : ""}
                </span>
              </MetaItem>
              {resolvedReg && (
                <>
                  <Dot />
                  <MetaItem>
                    <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{resolvedReg}</span>
                  </MetaItem>
                </>
              )}
              {resolvedSeats !== undefined && (
                <>
                  <Dot />
                  <MetaItem>
                    <EventSeatIcon sx={{ fontSize: 14, color: colors.mutedText }} />
                    <span>{resolvedSeats} seats</span>
                  </MetaItem>
                </>
              )}
              {resolvedColor && (
                <>
                  <Dot />
                  <MetaItem>
                    <span>{resolvedColor}</span>
                  </MetaItem>
                </>
              )}
              {age !== null && (
                <>
                  <Dot />
                  <MetaItem>
                    <span>{age} yrs</span>
                  </MetaItem>
                </>
              )}
            </MetaRow>
          </Info>

          <RightCol>
            <RatingBadge>
              <StarIcon sx={{ fontSize: 13, color: displayRating > 0 ? "#F6AD55" : colors.mutedText }} />
              <RatingText rated={displayRating > 0}>
                {displayRating > 0 ? displayRating.toFixed(1) : "New"}
              </RatingText>
              {ratingCount !== undefined && ratingCount > 0 && (
                <RatingCount>({ratingCount})</RatingCount>
              )}
            </RatingBadge>
            <TripsCount>
              <RouteIcon sx={{ fontSize: 11, mr: 0.3 }} />
              {completedTrips ?? 0}
              {totalTrips !== undefined && totalTrips > 0 ? ` / ${totalTrips}` : ""}
              {" "}trip{(totalTrips ?? completedTrips ?? 0) !== 1 ? "s" : ""}
            </TripsCount>
          </RightCol>
        </TopSection>

        {/* ── Estate + Schools row ── */}
        {(estate || visibleSchools.length > 0) && (
          <BottomSection>
            {estate && (
              <EstateTag>
                <LocationOnIcon sx={{ fontSize: 11, mr: 0.25 }} />
                {estate}
              </EstateTag>
            )}
            {visibleSchools.map((s) => (
              <SchoolTag key={s._id}>
                <SchoolIcon sx={{ fontSize: 11, mr: 0.25 }} />
                {s.name}
              </SchoolTag>
            ))}
            {extraSchools > 0 && (
              <MoreTag>+{extraSchools} more</MoreTag>
            )}
          </BottomSection>
        )}
      </Card>
    </Link>
  );
};

export default ProfileCard;

// ── Styled components ────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  animation: ${fadeUp} 0.35s ease both;
  transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;

  &:hover {
    box-shadow: 0 6px 24px rgba(26, 54, 93, 0.11);
    border-color: ${colors.skyBlue}66;
    transform: translateY(-2px);
  }
  &:active { transform: translateY(0); }
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const BottomSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${colors.border};
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
`;

const FullName = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${colors.deepNavy};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const VerifiedDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${colors.successGreen};
  flex-shrink: 0;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.78rem;
  color: ${colors.mutedText};
`;

const Dot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: ${colors.border};
  flex-shrink: 0;
`;

const RightCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
`;

const RatingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
`;

const RatingText = styled.span<{ rated: boolean }>`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ rated }) => (rated ? colors.deepNavy : colors.mutedText)};
`;

const RatingCount = styled.span`
  font-size: 0.7rem;
  color: ${colors.mutedText};
  font-weight: 400;
`;

const TripsCount = styled.span`
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  color: ${colors.mutedText};
  font-weight: 500;
`;

const EstateTag = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${colors.deepNavy};
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 50px;
  padding: 2px 8px;
`;

const SchoolTag = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 500;
  color: ${colors.skyBlue};
  background: ${colors.skyBlue}15;
  border: 1px solid ${colors.skyBlue}33;
  border-radius: 50px;
  padding: 2px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
`;

const MoreTag = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 500;
  color: ${colors.mutedText};
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 50px;
  padding: 2px 8px;
`;

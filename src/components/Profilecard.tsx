"use client";

import React from "react";
import styled from "styled-components";
import { Avatar } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import Link from "next/link";
import { colors } from "@/lib/theme";

export interface DriverProfile {
  _id: string;
  photo: string;
  fullName: string;
  phoneNumber: string;
  sex: string;
  dob: string;
  carRegNumber: string;
  carModel: string;
  carMake?: string;
  carPhoto: string;
  availableSeats?: number;
  rating?: number;
  averageRating?: number;
  verificationStatus?: string;
}

const ProfileCard: React.FC<DriverProfile> = ({
  _id,
  photo,
  fullName,
  carRegNumber,
  carModel,
  carMake,
  availableSeats,
  rating,
  averageRating,
  verificationStatus,
}) => {
  const displayRating = averageRating ?? rating ?? 0;
  const isApproved = verificationStatus === "approved" || !verificationStatus;

  return (
    <Link href={`/drivers/${_id}`} style={{ textDecoration: "none" }}>
      <Card>
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
            {isApproved && <VerifiedDot />}
          </TopRow>
          <MetaRow>
            <MetaItem>
              <DirectionsCarIcon sx={{ fontSize: 14, color: colors.mutedText }} />
              <span>{carMake ? `${carMake} ${carModel}` : carModel}</span>
            </MetaItem>
            <Dot />
            <MetaItem>
              <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{carRegNumber}</span>
            </MetaItem>
            {availableSeats !== undefined && (
              <>
                <Dot />
                <MetaItem>
                  <EventSeatIcon sx={{ fontSize: 14, color: colors.mutedText }} />
                  <span>{availableSeats} seats</span>
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
          </RatingBadge>
          <ViewBtn>View</ViewBtn>
        </RightCol>
      </Card>
    </Link>
  );
};

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s, transform 0.15s;

  &:hover {
    box-shadow: 0 4px 20px rgba(26, 54, 93, 0.1);
    border-color: ${colors.skyBlue}66;
    transform: translateY(-1px);
  }
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
  gap: 6px;
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

const ViewBtn = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${colors.skyBlue};
  padding: 3px 10px;
  border: 1px solid ${colors.skyBlue}55;
  border-radius: 50px;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;

  ${Card}:hover & {
    background: ${colors.skyBlue};
    color: #fff;
    border-color: ${colors.skyBlue};
  }
`;

export default ProfileCard;

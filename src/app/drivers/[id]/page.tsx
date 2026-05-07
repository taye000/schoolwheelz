"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import styled from "styled-components";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import WcIcon from "@mui/icons-material/Wc";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import DriveEtaIcon from "@mui/icons-material/DriveEta";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Button, CircularProgress, Typography, Chip } from "@mui/material";
import { DriverProfile } from "@/components/Profilecard";
import BookingForm from "@/components/BookingForm";
import { colors } from "@/lib/theme";

interface User {
  _id: string;
  userType: "parent" | "driver";
  fullName: string;
  email: string;
  phoneNumber: string;
  children?: Array<{
    _id: string;
    name: string;
    age: number;
    grade: string;
    school: string;
    gender: string;
  }>;
}

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDriver = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await axios.get(`/api/drivers/${id}`);
        if (res.data.success) setDriverProfile(res.data.data);
        else setDriverProfile(null);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data.success) setUser(data.user);
      } catch {
        /* not logged in */
      }
    };
    fetchUser();
  }, []);

  if (loading)
    return (
      <LoadingWrap>
        <CircularProgress sx={{ color: colors.deepNavy }} />
        <LoadingText>Loading driver profile…</LoadingText>
      </LoadingWrap>
    );

  if (error)
    return (
      <LoadingWrap>
        <EmptyEmoji>🚧</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          Hit a speed bump
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
          Couldn’t load this driver’s profile. Check your connection.
        </Typography>
        <Button variant="contained" onClick={() => router.push("/drivers")}>
          Back to Drivers
        </Button>
      </LoadingWrap>
    );

  if (!driverProfile)
    return (
      <LoadingWrap>
        <EmptyEmoji>🕵️</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          Driver not found
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
          They may have driven off — or this link might be wrong.
        </Typography>
        <Button variant="contained" onClick={() => router.push("/drivers")}>
          Browse Other Drivers
        </Button>
      </LoadingWrap>
    );

  const rating = 4.5;
  const age =
    new Date().getFullYear() - new Date(driverProfile.dob).getFullYear();

  return (
    <PageWrapper>
      <BackBtn onClick={() => router.push("/drivers")}>
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Back to Drivers
      </BackBtn>

      <ContentGrid>
        {/* LEFT */}
        <LeftCol>
          <HeroCard>
            <DriverAvatar src={driverProfile.photo || "/avatar.jpg"} alt={driverProfile.fullName} />
            <DriverInfo>
              <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>
                {driverProfile.fullName}
              </Typography>
              <Chip
                icon={<DriveEtaIcon />}
                label={driverProfile.carModel}
                size="small"
                sx={{ bgcolor: colors.deepNavy, color: "#fff", fontWeight: 600, mr: 1 }}
              />
              <RatingRow>
                {Array.from({ length: Math.floor(rating) }).map((_, i) => (
                  <StarIcon key={i} sx={{ color: "#F6C90E", fontSize: 20 }} />
                ))}
                {rating % 1 !== 0 && <StarHalfIcon sx={{ color: "#F6C90E", fontSize: 20 }} />}
                {Array.from({ length: 5 - Math.ceil(rating) }).map((_, i) => (
                  <StarOutlineIcon key={i} sx={{ color: "#F6C90E", fontSize: 20 }} />
                ))}
                <RatingBadge>{rating.toFixed(1)}</RatingBadge>
              </RatingRow>
            </DriverInfo>
          </HeroCard>

          <InfoSection>
            <SectionTitle>Contact & Personal</SectionTitle>
            <InfoGrid>
              <InfoTile><PhoneIcon sx={{ color: colors.skyBlue }} /><span>{driverProfile.phoneNumber}</span></InfoTile>
              <InfoTile><WcIcon sx={{ color: colors.skyBlue }} /><span>{driverProfile.sex}</span></InfoTile>
              <InfoTile><CalendarTodayIcon sx={{ color: colors.skyBlue }} /><span>{age} years old</span></InfoTile>
              <InfoTile><EventSeatIcon sx={{ color: colors.mintCream }} /><span>{driverProfile.availableSeats ?? "—"} seats</span></InfoTile>
            </InfoGrid>
          </InfoSection>

          <InfoSection>
            <SectionTitle>Vehicle</SectionTitle>
            <InfoGrid>
              <InfoTile><DriveEtaIcon sx={{ color: colors.skyBlue }} /><span>{driverProfile.carModel}</span></InfoTile>
              <InfoTile><span style={{ fontWeight: 600 }}>{driverProfile.carRegNumber}</span></InfoTile>
            </InfoGrid>
            {driverProfile.carPhoto && (
              <CarImg src={driverProfile.carPhoto} alt="Vehicle" />
            )}
          </InfoSection>
        </LeftCol>

        {/* RIGHT */}
        <RightCol>
          <BookingCard>
            <SectionTitle>Schedule a Pick-up</SectionTitle>
            {!user ? (
              <RegisterPrompt>
                <Typography variant="body1" sx={{ color: colors.mutedText, mb: 3 }}>
                  Ready to book a ride with {driverProfile.fullName}?
                </Typography>
                <Button variant="contained" href="/register" fullWidth size="large">
                  Register Now
                </Button>
                <Button variant="outlined" href="/login" fullWidth size="large" sx={{ mt: 1.5 }}>
                  Already have an account? Sign in
                </Button>
              </RegisterPrompt>
            ) : user.userType === "parent" ? (
              <BookingForm parent={user} driverId={driverProfile._id} />
            ) : (
              <Typography variant="body2" sx={{ color: colors.mutedText }}>
                Drivers cannot book rides.
              </Typography>
            )}
          </BookingCard>
        </RightCol>
      </ContentGrid>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 36px 24px;
`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid ${colors.border};
  padding: 8px 18px;
  border-radius: 50px;
  color: ${colors.deepNavy};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  margin-bottom: 28px;
  transition: all 0.2s;
  &:hover { background: ${colors.deepNavy}; color: #fff; border-color: ${colors.deepNavy}; }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 28px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const LeftCol = styled.div`display: flex; flex-direction: column; gap: 20px;`;
const RightCol = styled.div``;

const HeroCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 20px;
  padding: 28px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  box-shadow: 0 4px 24px rgba(26,54,93,0.06);
  @media (max-width: 500px) { flex-direction: column; }
`;

const DriverAvatar = styled.img`
  width: 110px; height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${colors.skyBlue};
  flex-shrink: 0;
`;

const DriverInfo = styled.div`display: flex; flex-direction: column; gap: 8px;`;

const RatingRow = styled.div`
  display: flex; align-items: center; gap: 4px; margin-top: 6px;
`;

const RatingBadge = styled.span`
  background: ${colors.deepNavy};
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: 8px;
  padding: 2px 10px;
  margin-left: 8px;
`;

const InfoSection = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(26,54,93,0.04);
`;

const SectionTitle = styled.h3`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${colors.skyBlue};
  margin: 0 0 16px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const InfoTile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.9rem;
  color: ${colors.slateCharcoal};
  font-weight: 500;
`;

const CarImg = styled.img`
  width: 100%; max-height: 180px; object-fit: cover;
  border-radius: 12px; margin-top: 16px;
`;

const BookingCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 24px rgba(26,54,93,0.06);
  position: sticky;
  top: 24px;
`;

const RegisterPrompt = styled.div`
  text-align: center;
`;

const LoadingWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
  gap: 8px;
`;

const LoadingText = styled.p`
  font-size: 0.925rem;
  color: ${colors.mutedText};
  font-style: italic;
  margin-top: 8px;
`;

const EmptyEmoji = styled.div`
  font-size: 3.5rem;
  margin-bottom: 8px;
`;

const EmptyState = styled.div`
  text-align: center; padding: 80px 0;
`;

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  Typography,
  CircularProgress,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import styled from "styled-components";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import { colors } from "@/lib/theme";

interface IChild {
  name: string;
  age: number;
  school: string;
  gender: string;
}

interface IBooking {
  _id: string;
  driver: { fullName: string } | null;
  parent: { fullName: string } | null;
  children: IChild[];
  seatsBooked: number;
  tripDate: string;
  status: string;
  bookingId: string;
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FFF3CD", color: "#856404" },
  accepted: { bg: "#D4EDDA", color: "#155724" },
  canceled: { bg: "#F8D7DA", color: "#721C24" },
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setError(false);
    axios
      .get(`/api/bookings?id=${id}`, { withCredentials: true })
      .then((res) => { if (res.data.success) setBooking(res.data.data); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Center>
        <CircularProgress sx={{ color: colors.deepNavy }} />
        <LoadingText>Fetching booking details…</LoadingText>
      </Center>
    );

  if (error)
    return (
      <Center>
        <EmptyEmoji>🚧</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          Something went wrong
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
          Couldn’t load this booking. Check your connection and try again.
        </Typography>
        <Button variant="contained" onClick={() => router.push("/bookings")}>
          Back to Bookings
        </Button>
      </Center>
    );

  if (!booking)
    return (
      <Center>
        <EmptyEmoji>🔍</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          Booking not found
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
          This booking doesn’t exist or may have been removed.
        </Typography>
        <Button variant="contained" onClick={() => router.push("/bookings")}>
          Back to Bookings
        </Button>
      </Center>
    );

  const sc = statusColors[booking.status] ?? { bg: colors.lightBg, color: colors.mutedText };

  return (
    <PageWrapper>
      <BackBtn onClick={() => router.push("/bookings")}>
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Back to Bookings
      </BackBtn>

      <Card>
        <HeaderRow>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy }}>
              Booking Details
            </Typography>
            <Typography variant="body2" sx={{ color: colors.mutedText, mt: 0.5 }}>
              ID: {booking.bookingId}
            </Typography>
          </div>
          <Chip
            label={booking.status}
            sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, textTransform: "capitalize", fontSize: "0.9rem", padding: "4px 4px" }}
          />
        </HeaderRow>

        <Divider sx={{ my: 3 }} />

        <InfoGrid>
          <InfoBlock label="Driver" value={booking.driver?.fullName || "—"} />
          <InfoBlock label="Parent" value={booking.parent?.fullName || "—"} />
          <InfoBlock label="Trip Date" value={new Date(booking.tripDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />
          <InfoBlock label="Seats Booked" value={String(booking.seatsBooked)} />
        </InfoGrid>

        <Divider sx={{ my: 3 }} />

        <ChildrenSection>
          <ChildrenHeader>
            <ChildCareIcon sx={{ color: colors.mintCream, mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.deepNavy }}>
              Children ({booking.children.length})
            </Typography>
          </ChildrenHeader>
          {booking.children.map((c, i) => (
            <ChildItem key={i}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {c.name}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.mutedText }}>
                {c.age} yrs · {c.gender} · {c.school}
              </Typography>
            </ChildItem>
          ))}
        </ChildrenSection>
      </Card>
    </PageWrapper>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <InfoBlockWrap>
      <InfoLabel>{label}</InfoLabel>
      <InfoValue>{value}</InfoValue>
    </InfoBlockWrap>
  );
}

const PageWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 24px;
`;

const BackBtn = styled.button`
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid ${colors.border};
  padding: 8px 18px; border-radius: 50px;
  color: ${colors.deepNavy}; font-weight: 600; font-size: 0.875rem;
  cursor: pointer; margin-bottom: 28px; transition: all 0.2s;
  &:hover { background: ${colors.deepNavy}; color: #fff; border-color: ${colors.deepNavy}; }
`;

const Card = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(26,54,93,0.08);
  @media (max-width: 600px) { padding: 24px; }
`;

const HeaderRow = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px;
`;

const InfoGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const InfoBlockWrap = styled.div`
  background: ${colors.lightBg}; border: 1px solid ${colors.border};
  border-radius: 12px; padding: 16px 20px;
`;

const InfoLabel = styled.p`
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; color: ${colors.mutedText}; margin: 0 0 4px;
`;

const InfoValue = styled.p`
  font-size: 1rem; font-weight: 600; color: ${colors.deepNavy}; margin: 0;
`;

const ChildrenSection = styled.div``;

const ChildrenHeader = styled.div`
  display: flex; align-items: center; margin-bottom: 16px;
`;

const ChildItem = styled.div`
  padding: 14px 18px; background: ${colors.lightBg};
  border-radius: 12px; border: 1px solid ${colors.border}; margin-bottom: 10px;
`;

const Center = styled.div`
  display: flex; flex-direction: column; justify-content: center;
  align-items: center; min-height: 60vh; text-align: center; gap: 8px;
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

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import styled from "styled-components";
import { Typography, CircularProgress, Chip, Divider } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import PersonPinCircleIcon from "@mui/icons-material/PersonPinCircle";
import SchoolIcon from "@mui/icons-material/School";
import { colors } from "@/lib/theme";
import toast from "react-hot-toast";

interface IBookedChild {
  _id: string;
  name: string;
  age: number;
  school: string;
  gender: string;
  guardianNotes?: string;
  pickedUp: boolean;
  droppedOff: boolean;
  pickupLocation?: { lat: number; lng: number };
  dropoffLocation?: { lat: number; lng: number };
}

interface IBooking {
  _id: string;
  bookingId: string;
  bookingType: string;
  direction: string;
  status: string;
  tripDate: string;
  seatsBooked: number;
  children: IBookedChild[];
  driver: { _id: string; fullName: string; email: string; phoneNumber: string } | null;
  parent: { _id: string; fullName: string; email: string; phoneNumber: string } | null;
  tracking?: { isTrackingEnabled: boolean };
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:         { bg: "#FFF3CD", color: "#856404" },
  accepted:        { bg: "#D4EDDA", color: "#155724" },
  in_progress:     { bg: "#CCE5FF", color: "#004085" },
  driver_assigned: { bg: "#E2D9F3", color: "#4A235A" },
  completed:       { bg: "#D1ECF1", color: "#0C5460" },
  canceled:        { bg: "#F8D7DA", color: "#721C24" },
};

export default function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/bookings?id=${id}`, { withCredentials: true })
      .then((res) => { if (res.data.success) setBooking(res.data.data); })
      .catch(() => toast.error("Could not load booking."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Center><CircularProgress sx={{ color: colors.deepNavy }} /></Center>;
  if (!booking) return <Center><Typography>Booking not found.</Typography></Center>;

  const sc = STATUS_COLORS[booking.status] ?? { bg: colors.lightBg, color: colors.mutedText };

  const allPickedUp = booking.children.every((c) => c.pickedUp);
  const allDroppedOff = booking.children.every((c) => c.droppedOff);

  return (
    <PageWrapper>
      <BackBtn onClick={() => router.push("/admin")}>
        <ArrowBackIcon sx={{ fontSize: 17 }} /> Back to Admin
      </BackBtn>

      {/* Header */}
      <HeaderRow>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800, color: colors.deepNavy }}>
            Booking Detail
          </Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText, mt: 0.5, fontFamily: "monospace" }}>
            {booking.bookingId}
          </Typography>
        </div>
        <Chip
          label={booking.status.replace("_", " ")}
          sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, textTransform: "capitalize", fontSize: "0.88rem", px: 1 }}
        />
      </HeaderRow>

      <TwoCol>
        {/* Left */}
        <div>
          <Section>
            <SectionTitle>Trip Info</SectionTitle>
            <InfoGrid>
              <InfoRow label="Type" value={booking.bookingType === "recurring" ? "Recurring Subscription" : "One-Time"} />
              <InfoRow label="Direction" value={
                booking.direction === "both" ? "Morning & Evening" :
                booking.direction === "morning" ? "Morning Pickup" : "Evening Dropoff"
              } />
              <InfoRow label="Trip Date" value={new Date(booking.tripDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
              <InfoRow label="Seats Booked" value={String(booking.seatsBooked)} />
              <InfoRow label="Tracking" value={booking.tracking?.isTrackingEnabled ? "Enabled" : "Disabled"} />
              <InfoRow label="Created" value={new Date(booking.createdAt).toLocaleDateString("en-GB")} />
            </InfoGrid>
          </Section>

          <Section>
            <SectionTitle>Parent</SectionTitle>
            {booking.parent ? (
              <InfoGrid>
                <InfoRow label="Name" value={booking.parent.fullName} />
                <InfoRow label="Email" value={booking.parent.email} />
                <InfoRow label="Phone" value={booking.parent.phoneNumber} />
                <ViewProfileBtn onClick={() => router.push(`/admin/parents/${booking.parent!._id}`)}>
                  View Parent Profile
                </ViewProfileBtn>
              </InfoGrid>
            ) : <NoData>Parent not found.</NoData>}
          </Section>

          <Section>
            <SectionTitle>Driver</SectionTitle>
            {booking.driver ? (
              <InfoGrid>
                <InfoRow label="Name" value={booking.driver.fullName} />
                <InfoRow label="Email" value={booking.driver.email} />
                <InfoRow label="Phone" value={booking.driver.phoneNumber} />
                <ViewProfileBtn onClick={() => router.push(`/admin/drivers/${booking.driver!._id}`)}>
                  View Driver Profile
                </ViewProfileBtn>
              </InfoGrid>
            ) : <NoData>No driver assigned yet.</NoData>}
          </Section>
        </div>

        {/* Right */}
        <div>
          <Section>
            <SectionTitle>
              <ChildCareIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
              Children ({booking.children.length})
              {allDroppedOff && (
                <Chip size="small" label="All Delivered" color="success" sx={{ ml: 1.5, verticalAlign: "middle" }} />
              )}
            </SectionTitle>
            {booking.children.map((child, idx) => (
              <ChildCard key={child._id} done={child.droppedOff}>
                <ChildHeader>
                  <ChildNum>{idx + 1}</ChildNum>
                  <div style={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: colors.slateCharcoal }}>
                      {child.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.mutedText }}>
                      {child.age} yrs · {child.gender} · {child.school}
                    </Typography>
                  </div>
                  <StatusPills>
                    <MiniChip picked={child.pickedUp}>{child.pickedUp ? "✓ Picked Up" : "Not Picked Up"}</MiniChip>
                    <MiniChip picked={child.droppedOff}>{child.droppedOff ? "✓ Dropped Off" : "Not Dropped Off"}</MiniChip>
                  </StatusPills>
                </ChildHeader>
                {child.guardianNotes && (
                  <GuardianNote>💬 {child.guardianNotes}</GuardianNote>
                )}
                {(child.pickupLocation || child.dropoffLocation) && (
                  <LocRow>
                    {child.pickupLocation && (
                      <LocTag>
                        <PersonPinCircleIcon sx={{ fontSize: 13, color: colors.skyBlue }} />
                        Pickup: {child.pickupLocation.lat.toFixed(5)}, {child.pickupLocation.lng.toFixed(5)}
                      </LocTag>
                    )}
                    {child.dropoffLocation && (
                      <LocTag>
                        <SchoolIcon sx={{ fontSize: 13, color: colors.mintCream }} />
                        Drop-off: {child.dropoffLocation.lat.toFixed(5)}, {child.dropoffLocation.lng.toFixed(5)}
                      </LocTag>
                    )}
                  </LocRow>
                )}
              </ChildCard>
            ))}
          </Section>
        </div>
      </TwoCol>
    </PageWrapper>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <InfoRowWrap>
      <InfoLabel>{label}</InfoLabel>
      <InfoValue>{value}</InfoValue>
    </InfoRowWrap>
  );
}

/* ─── Styled components ──────────────────────────────────────── */

const PageWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 36px 24px 80px;
`;

const Center = styled.div`
  display: flex; align-items: center; justify-content: center; min-height: 60vh;
`;

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: 1px solid ${colors.border};
  padding: 7px 16px; border-radius: 50px;
  color: ${colors.deepNavy}; font-weight: 600; font-size: 0.85rem;
  cursor: pointer; margin-bottom: 28px; transition: all 0.2s;
  &:hover { background: ${colors.deepNavy}; color: #fff; border-color: ${colors.deepNavy}; }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;

const Section = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 22px;
  margin-bottom: 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
`;

const SectionTitle = styled.p`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${colors.mutedText};
  margin: 0 0 14px;
  display: flex;
  align-items: center;
`;

const InfoGrid = styled.div`
  display: flex; flex-direction: column; gap: 10px;
`;

const InfoRowWrap = styled.div`
  display: flex; justify-content: space-between; gap: 12px; align-items: baseline;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem; color: ${colors.mutedText}; white-space: nowrap;
`;

const InfoValue = styled.span`
  font-size: 0.88rem; font-weight: 600; color: ${colors.slateCharcoal}; text-align: right;
`;

const NoData = styled.p`
  font-size: 0.85rem; color: ${colors.mutedText}; font-style: italic; margin: 0;
`;

const ViewProfileBtn = styled.button`
  align-self: flex-start;
  margin-top: 4px;
  background: none;
  border: 1px solid ${colors.border};
  border-radius: 50px;
  padding: 5px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${colors.deepNavy};
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: ${colors.deepNavy}; color: #fff; border-color: ${colors.deepNavy}; }
`;

const ChildCard = styled.div<{ done: boolean }>`
  border: 1px solid ${({ done }) => done ? colors.mintCream : colors.border};
  background: ${({ done }) => done ? "#F0FFF4" : colors.lightBg};
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
`;

const ChildHeader = styled.div`
  display: flex; align-items: flex-start; gap: 12px;
`;

const ChildNum = styled.div`
  width: 24px; height: 24px; min-width: 24px;
  border-radius: 50%;
  background: ${colors.deepNavy}; color: #fff;
  font-size: 0.75rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
`;

const StatusPills = styled.div`
  display: flex; flex-direction: column; gap: 4px; align-items: flex-end;
`;

const MiniChip = styled.span<{ picked: boolean }>`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ picked }) => picked ? colors.successGreen : colors.mutedText};
  white-space: nowrap;
`;

const GuardianNote = styled.p`
  font-size: 0.78rem; color: ${colors.warningAmber};
  margin: 8px 0 0; font-style: italic;
`;

const LocRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
`;

const LocTag = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.72rem; color: ${colors.mutedText};
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 6px; padding: 3px 8px;
`;

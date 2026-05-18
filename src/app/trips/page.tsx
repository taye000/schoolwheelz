"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import {
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Tooltip,
  Button,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SchoolIcon from "@mui/icons-material/School";
import PersonPinCircleIcon from "@mui/icons-material/PersonPinCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import CloseIcon from "@mui/icons-material/Close";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

/* ─── Types ─────────────────────────────────────────────────── */

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

interface IParent {
  _id: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
}

interface ITrip {
  _id: string;
  bookingId: string;
  status: string;
  direction: string;
  tripDate: string;
  seatsBooked: number;
  children: IBookedChild[];
  parent: IParent;
}

interface IPendingBooking {
  _id: string;
  bookingId: string;
  status: string;
  tripDate: string;
  seatsBooked: number;
  children: { name: string; age: number; school: string; gender: string }[];
  parent: { fullName: string; phoneNumber: string } | null;
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function DriverTripsPage() {
  const router = useRouter();
  const [driverId, setDriverId] = useState<string | null>(null);

  // Today's trips (accepted + in_progress)
  const [trips, setTrips] = useState<ITrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);

  // Pending booking requests
  const [pending, setPending] = useState<IPendingBooking[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  const [actioning, setActioning] = useState<string | null>(null); // id of item being mutated
  // reject flow: track which card is in reject-reason-entry mode + the typed reason
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  /* ── Auth ── */
  useEffect(() => {
    axios
      .get("/api/auth/me", { withCredentials: true })
      .then((res) => {
        if (!res.data.success || res.data.user.userType !== "driver") {
          router.replace("/login");
          return;
        }
        setDriverId(res.data.user._id);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  /* ── Fetch today's trips ── */
  const loadTrips = useCallback(async () => {
    if (!driverId) return;
    setTripsLoading(true);
    try {
      const { data } = await axios.get(`/api/drivers/${driverId}/trips/today`, {
        withCredentials: true,
      });
      if (data.success) setTrips(data.data);
    } catch {
      toast.error("Could not load today's trips.");
    } finally {
      setTripsLoading(false);
    }
  }, [driverId]);

  /* ── Fetch pending booking requests ── */
  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const { data } = await axios.get("/api/bookings", { withCredentials: true });
      if (data.success) {
        setPending((data.data as IPendingBooking[]).filter((b) => b.status === "pending"));
      }
    } catch {
      toast.error("Could not load pending requests.");
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (driverId) {
      loadTrips();
      loadPending();
    }
  }, [driverId, loadTrips, loadPending]);

  /* ── Actions ── */

  const handleAccept = async (bookingId: string) => {
    setActioning(bookingId);
    try {
      await axios.patch(`/api/bookings/${bookingId}/accept`, {}, { withCredentials: true });
      toast.success("Booking accepted. Parent notified.");
      await Promise.all([loadPending(), loadTrips()]);
    } catch {
      toast.error("Could not accept booking.");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    setActioning(bookingId);
    try {
      await axios.patch(
        `/api/bookings/${bookingId}/reject`,
        { reason: rejectReason.trim() || undefined },
        { withCredentials: true }
      );
      toast.success("Booking rejected. Parent notified.");
      setRejectingId(null);
      setRejectReason("");
      await loadPending();
    } catch {
      toast.error("Could not reject booking.");
    } finally {
      setActioning(null);
    }
  };

  const handleStart = async (tripId: string) => {
    setActioning(tripId);
    try {
      await axios.post(`/api/bookings/${tripId}/start`, {}, { withCredentials: true });
      toast.success("Trip started! Parent notified via SMS.");
      await loadTrips();
    } catch {
      toast.error("Could not start trip.");
    } finally {
      setActioning(null);
    }
  };

  const handlePickup = async (tripId: string, childId: string, childName: string) => {
    const key = `${tripId}-pickup-${childId}`;
    setActioning(key);
    try {
      await axios.patch(`/api/bookings/${tripId}/pickup/${childId}`, {}, { withCredentials: true });
      toast.success(`${childName} marked as picked up.`);
      await loadTrips();
    } catch {
      toast.error("Could not mark pickup.");
    } finally {
      setActioning(null);
    }
  };

  const handleDropoff = async (tripId: string, childId: string, childName: string) => {
    const key = `${tripId}-dropoff-${childId}`;
    setActioning(key);
    try {
      await axios.patch(`/api/bookings/${tripId}/dropoff/${childId}`, {}, { withCredentials: true });
      toast.success(`${childName} dropped off. Parent notified.`);
      await loadTrips();
    } catch {
      toast.error("Could not mark drop-off.");
    } finally {
      setActioning(null);
    }
  };

  /* ── Render ── */

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!driverId) {
    return (
      <Center>
        <CircularProgress sx={{ color: colors.deepNavy }} />
      </Center>
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <Header>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.deepNavy }}>
            Today&apos;s Trips
          </Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText, mt: 0.5 }}>
            {today}
          </Typography>
        </div>
        <DirectionsCarIcon sx={{ fontSize: 40, color: colors.skyBlue, opacity: 0.6 }} />
      </Header>

      {/* ── Pending Requests ── */}
      <SectionLabel>Pending Requests</SectionLabel>

      {pendingLoading ? (
        <LoadRow><CircularProgress size={22} sx={{ color: colors.deepNavy }} /></LoadRow>
      ) : pending.length === 0 ? (
        <EmptyCard>No pending booking requests.</EmptyCard>
      ) : (
        pending.map((b) => (
          <PendingCard key={b._id}>
            <PendingTop>
              <div>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.deepNavy }}>
                  {b.parent?.fullName ?? "Unknown Parent"}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.mutedText }}>
                  {new Date(b.tripDate).toLocaleDateString("en-GB", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                  {" · "}
                  {b.seatsBooked} seat{b.seatsBooked !== 1 ? "s" : ""}
                  {" · "}ID: {b.bookingId}
                </Typography>
              </div>
              <Chip label="Pending" size="small" sx={{ bgcolor: "#FFF3CD", color: "#856404", fontWeight: 700 }} />
            </PendingTop>

            <ChildPills>
              {b.children.map((c, i) => (
                <ChildPill key={i}>
                  <SchoolIcon sx={{ fontSize: 13, mr: 0.5, color: colors.mutedText }} />
                  {c.name} · {c.school}
                </ChildPill>
              ))}
            </ChildPills>

            {/* Inline reject form */}
            {rejectingId === b._id && (
              <RejectForm>
                <RejectInput
                  placeholder="Reason (optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  autoFocus
                />
                <RejectConfirmBtn
                  disabled={actioning === b._id}
                  onClick={() => handleReject(b._id)}
                >
                  {actioning === b._id
                    ? <CircularProgress size={14} sx={{ color: "#fff" }} />
                    : "Confirm Reject"}
                </RejectConfirmBtn>
                <CancelRejectBtn onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                  <CloseIcon sx={{ fontSize: 15 }} />
                </CancelRejectBtn>
              </RejectForm>
            )}

            <CardActions>
              <AcceptBtn
                disabled={actioning === b._id || rejectingId === b._id}
                onClick={() => handleAccept(b._id)}
              >
                {actioning === b._id ? (
                  <CircularProgress size={16} sx={{ color: "#fff" }} />
                ) : (
                  <>
                    <HowToRegIcon sx={{ fontSize: 17, mr: 0.75 }} />
                    Accept
                  </>
                )}
              </AcceptBtn>

              {rejectingId !== b._id && (
                <RejectBtn
                  disabled={actioning === b._id}
                  onClick={() => { setRejectingId(b._id); setRejectReason(""); }}
                >
                  Reject
                </RejectBtn>
              )}
            </CardActions>
          </PendingCard>
        ))
      )}

      {/* ── Today's Route ── */}
      <SectionLabel>Today&apos;s Route</SectionLabel>

      {tripsLoading ? (
        <LoadRow><CircularProgress size={22} sx={{ color: colors.deepNavy }} /></LoadRow>
      ) : trips.length === 0 ? (
        <EmptyCard>No accepted or active trips for today.</EmptyCard>
      ) : (
        trips.map((trip) => {
          const allPickedUp = trip.children.every((c) => c.pickedUp);
          const allDroppedOff = trip.children.every((c) => c.droppedOff);
          const isActive = trip.status === "in_progress";
          const isAccepted = trip.status === "accepted";

          return (
            <TripCard key={trip._id}>
              {/* Trip header */}
              <TripHeader>
                <div>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.deepNavy }}>
                    {trip.parent?.fullName}
                    <ContactLink href={`tel:${trip.parent?.phoneNumber}`}>
                      {trip.parent?.phoneNumber}
                    </ContactLink>
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.mutedText }}>
                    {new Date(trip.tripDate).toLocaleDateString("en-GB", {
                      weekday: "short", day: "numeric", month: "short",
                    })}
                    {" · "}
                    {trip.direction === "both"
                      ? "Morning & Evening"
                      : trip.direction === "morning"
                      ? "Morning Pickup"
                      : "Evening Dropoff"}
                    {" · "}ID: {trip.bookingId}
                  </Typography>
                </div>
                <TripStatusChip status={trip.status} />
              </TripHeader>

              <Divider sx={{ my: 1.5 }} />

              {/* Start Trip button (only when accepted, not yet in_progress) */}
              {isAccepted && (
                <StartBtn
                  disabled={actioning === trip._id}
                  onClick={() => handleStart(trip._id)}
                >
                  {actioning === trip._id ? (
                    <CircularProgress size={16} sx={{ color: "#fff" }} />
                  ) : (
                    <>
                      <PlayArrowIcon sx={{ fontSize: 18, mr: 0.75 }} />
                      Start Trip — SMS parent &ldquo;Driver on the way&rdquo;
                    </>
                  )}
                </StartBtn>
              )}

              {/* Children list */}
              <ChildrenList>
                {trip.children.map((child, idx) => {
                  const pickupKey = `${trip._id}-pickup-${child._id}`;
                  const dropoffKey = `${trip._id}-dropoff-${child._id}`;
                  return (
                    <ChildRow key={child._id} done={child.droppedOff}>
                      <ChildIndex>{idx + 1}</ChildIndex>
                      <ChildInfo>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: colors.slateCharcoal }}>
                          {child.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.mutedText }}>
                          {child.age} yrs · {child.gender} · {child.school}
                        </Typography>
                        {child.guardianNotes && (
                          <GuardianNote>💬 {child.guardianNotes}</GuardianNote>
                        )}
                        {child.pickupLocation && (
                          <LocLine>
                            <PersonPinCircleIcon sx={{ fontSize: 13, mr: 0.5, color: colors.skyBlue }} />
                            Pickup: {child.pickupLocation.lat.toFixed(4)}, {child.pickupLocation.lng.toFixed(4)}
                          </LocLine>
                        )}
                        {child.dropoffLocation && (
                          <LocLine>
                            <SchoolIcon sx={{ fontSize: 13, mr: 0.5, color: colors.mintCream }} />
                            Drop-off: {child.dropoffLocation.lat.toFixed(4)}, {child.dropoffLocation.lng.toFixed(4)}
                          </LocLine>
                        )}
                      </ChildInfo>

                      <ChildActions>
                        {/* Picked Up */}
                        {child.pickedUp ? (
                          <DoneTag color={colors.skyBlue}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 14, mr: 0.4 }} />
                            Picked Up
                          </DoneTag>
                        ) : (
                          <Tooltip title="Mark as picked up — SMS parent">
                            <ActionBtn
                              color="pickup"
                              disabled={!isActive || actioning === pickupKey}
                              onClick={() => handlePickup(trip._id, child._id, child.name)}
                            >
                              {actioning === pickupKey ? (
                                <CircularProgress size={13} sx={{ color: colors.skyBlue }} />
                              ) : (
                                "Picked Up"
                              )}
                            </ActionBtn>
                          </Tooltip>
                        )}

                        {/* Dropped Off */}
                        {child.droppedOff ? (
                          <DoneTag color={colors.successGreen}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 14, mr: 0.4 }} />
                            Dropped Off
                          </DoneTag>
                        ) : (
                          <Tooltip title="Mark as dropped off at school — SMS parent">
                            <ActionBtn
                              color="dropoff"
                              disabled={!isActive || !child.pickedUp || actioning === dropoffKey}
                              onClick={() => handleDropoff(trip._id, child._id, child.name)}
                            >
                              {actioning === dropoffKey ? (
                                <CircularProgress size={13} sx={{ color: colors.successGreen }} />
                              ) : (
                                "Dropped Off"
                              )}
                            </ActionBtn>
                          </Tooltip>
                        )}
                      </ChildActions>
                    </ChildRow>
                  );
                })}
              </ChildrenList>

              {allDroppedOff && (
                <CompletedBanner>
                  <CheckCircleOutlineIcon sx={{ mr: 1 }} />
                  All children delivered — trip complete!
                </CompletedBanner>
              )}
            </TripCard>
          );
        })
      )}
    </PageWrapper>
  );
}

/* ─── Status chip ────────────────────────────────────────────── */

function TripStatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    accepted:    { label: "Accepted",    bg: "#D4EDDA", color: "#155724" },
    in_progress: { label: "In Progress", bg: "#CCE5FF", color: "#004085" },
    completed:   { label: "Completed",   bg: "#D1ECF1", color: "#0C5460" },
  };
  const s = map[status] ?? { label: status, bg: colors.lightBg, color: colors.mutedText };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, textTransform: "capitalize" }}
    />
  );
}

/* ─── Styled components ──────────────────────────────────────── */

const PageWrapper = styled.div`
  max-width: 780px;
  margin: 0 auto;
  padding: 40px 24px 80px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36px;
`;

const SectionLabel = styled.p`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${colors.mutedText};
  margin: 28px 0 12px;
`;

const LoadRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
`;

const EmptyCard = styled.div`
  text-align: center;
  color: ${colors.mutedText};
  font-size: 0.9rem;
  border: 1px dashed ${colors.border};
  border-radius: 12px;
  padding: 24px;
`;

const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

/* Pending */
const PendingCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
`;

const PendingTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const ChildPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
`;

const ChildPill = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.78rem;
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 50px;
  padding: 3px 10px;
  color: ${colors.slateCharcoal};
`;

const AcceptBtn = styled.button<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  background: ${({ disabled }) => (disabled ? colors.border : colors.deepNavy)};
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 8px 20px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.88; }
`;

const CardActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const RejectBtn = styled.button<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  background: transparent;
  color: ${colors.errorRed};
  border: 2px solid ${colors.errorRed};
  border-radius: 50px;
  padding: 7px 18px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
  transition: all 0.2s;
  &:hover:not(:disabled) { background: ${colors.errorRed}; color: #fff; }
`;

const RejectForm = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  background: #FFF5F5;
  border: 1px solid #FEB2B2;
  border-radius: 10px;
  padding: 10px 12px;
`;

const RejectInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  color: ${colors.slateCharcoal};
  outline: none;
  &::placeholder { color: ${colors.mutedText}; }
`;

const RejectConfirmBtn = styled.button<{ disabled?: boolean }>`
  background: ${colors.errorRed};
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const CancelRejectBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.mutedText};
  display: flex;
  align-items: center;
  padding: 4px;
  &:hover { color: ${colors.slateCharcoal}; }
`;

/* Trip card */
const TripCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 22px;
  margin-bottom: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
`;

const TripHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ContactLink = styled.a`
  margin-left: 10px;
  font-size: 0.78rem;
  color: ${colors.skyBlue};
  font-weight: 500;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const StartBtn = styled.button<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  background: ${({ disabled }) => (disabled ? colors.border : colors.skyBlue)};
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 9px 22px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  margin-bottom: 14px;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.88; }
`;

const ChildrenList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ChildRow = styled.div<{ done: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: ${({ done }) => (done ? "#F0FFF4" : colors.lightBg)};
  border: 1px solid ${({ done }) => (done ? "#9AE6B4" : colors.border)};
  border-radius: 10px;
  padding: 14px;
  opacity: ${({ done }) => (done ? 0.7 : 1)};
  transition: all 0.2s;
`;

const ChildIndex = styled.div`
  width: 26px;
  height: 26px;
  min-width: 26px;
  border-radius: 50%;
  background: ${colors.deepNavy};
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
`;

const ChildInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const GuardianNote = styled.p`
  font-size: 0.78rem;
  color: ${colors.warningAmber};
  margin: 4px 0 0;
  font-style: italic;
`;

const LocLine = styled.p`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: ${colors.mutedText};
  margin: 3px 0 0;
`;

const ChildActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  min-width: 100px;
`;

const ActionBtn = styled.button<{ color: "pickup" | "dropoff"; disabled?: boolean }>`
  font-size: 0.78rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 50px;
  border: 2px solid ${({ color }) => (color === "pickup" ? colors.skyBlue : colors.successGreen)};
  color: ${({ color }) => (color === "pickup" ? colors.skyBlue : colors.successGreen)};
  background: #fff;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
  transition: all 0.15s;
  white-space: nowrap;
  min-width: 88px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover:not(:disabled) {
    background: ${({ color }) => (color === "pickup" ? colors.skyBlue : colors.successGreen)};
    color: #fff;
  }
`;

const DoneTag = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ color }) => color};
`;

const CompletedBanner = styled.div`
  display: flex;
  align-items: center;
  background: #F0FFF4;
  border: 1px solid ${colors.mintCream};
  border-radius: 8px;
  color: ${colors.successGreen};
  font-weight: 700;
  font-size: 0.875rem;
  padding: 12px 16px;
  margin-top: 16px;
`;

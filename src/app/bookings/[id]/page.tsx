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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material";
import styled from "styled-components";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import NightlightIcon from "@mui/icons-material/Nightlight";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import RepeatIcon from "@mui/icons-material/Repeat";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";
import TripJourneyPanel from "@/components/TripJourneyPanel";
import TripTrackingMap from "@/components/TripTrackingMap";
import RateDriverPanel from "@/components/RateDriverPanel";
import BookingRouteMap from "@/components/BookingRouteMap";

interface IChild {
  name: string;
  age: number;
  school: string;
  gender: string;
  pickupLocation?: { lat: number; lng: number };
  dropoffLocation?: { lat: number; lng: number };
}

interface IRecurringMeta {
  days: string[];
  startDate: string;
  endDate?: string | null;
  morningTime: string;
  eveningTime?: string | null;
}

interface IBooking {
  _id: string;
  bookingId: string;
  bookingType: "one_time" | "recurring";
  direction: "morning" | "evening" | "both";
  driver: { _id: string; fullName: string; phoneNumber?: string } | null;
  parent: { _id: string; fullName: string; phoneNumber?: string } | null;
  children: IChild[];
  seatsBooked: number;
  tripDate: string;
  returnTime?: string | null;
  arrivedAt?: string | null;
  recurringMeta?: IRecurringMeta;
  status: string;
  createdAt?: string;
  tracking?: {
    currentLocation?: { coordinates: [number, number] };
    isTrackingEnabled?: boolean;
    lastUpdated?: string;
  };
}

const STATUS_STEPS = ["pending", "accepted", "in_progress", "completed"];

const statusColors: Record<string, { bg: string; color: string }> = {
  pending:     { bg: "#FFF3CD", color: "#856404" },
  accepted:    { bg: "#D4EDDA", color: "#155724" },
  in_progress: { bg: "#CCE5FF", color: "#004085" },
  completed:   { bg: "#D4EDDA", color: "#155724" },
  canceled:    { bg: "#F8D7DA", color: "#721C24" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
};

const DIRECTION_CONFIG = {
  morning: { label: "Morning Pick-up Only",          icon: <WbSunnyIcon   sx={{ fontSize: 16, color: "#F6AD55" }}  /> },
  evening: { label: "Evening Drop-off Only",         icon: <NightlightIcon sx={{ fontSize: 16, color: "#9F7AEA" }} /> },
  both:    { label: "Morning & Evening (Both Ways)", icon: <SwapHorizIcon  sx={{ fontSize: 16, color: colors.skyBlue }} /> },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking]       = useState<IBooking | null>(null);
  const [userType, setUserType]     = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);

  // Parent: cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling]   = useState(false);

  // Driver: reject dialog
  const [rejectOpen, setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting]     = useState(false);
  const [accepting, setAccepting]     = useState(false);

  // Parent: review done
  const [reviewDone, setReviewDone]   = useState(false);

  useEffect(() => {
    if (!id) return;
    setError(false);
    Promise.all([
      axios.get(`/api/bookings?id=${id}`, { withCredentials: true }),
      axios.get("/api/auth/me", { withCredentials: true }).catch(() => null),
    ])
      .then(([bookingRes, meRes]) => {
        if (bookingRes.data.success) setBooking(bookingRes.data.data);
        if (meRes?.data?.success) setUserType(meRes.data.user.userType);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  /** Merge partial booking updates from child components */
  const handleBookingUpdate = (patch: Partial<IBooking>) => {
    setBooking((b) => b ? { ...b, ...patch } : b);
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await axios.post(`/api/bookings/${id}/cancel`, {}, { withCredentials: true });
      toast.success("Booking canceled.");
      setBooking((b) => b ? { ...b, status: "canceled" } : b);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to cancel booking.");
    } finally {
      setCanceling(false);
      setCancelOpen(false);
    }
  };

  /* ── Driver: accept ── */
  const handleAccept = async () => {
    setAccepting(true);
    try {
      await axios.patch(`/api/bookings/${id}/accept`, {}, { withCredentials: true });
      toast.success("Booking accepted! The parent has been notified.");
      setBooking((b) => b ? { ...b, status: "accepted" } : b);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to accept booking.");
    } finally {
      setAccepting(false);
    }
  };

  /* ── Driver: reject ── */
  const handleReject = async () => {
    setRejecting(true);
    try {
      await axios.patch(`/api/bookings/${id}/reject`, { reason: rejectReason }, { withCredentials: true });
      toast.success("Booking declined. The parent has been notified.");
      setBooking((b) => b ? { ...b, status: "canceled" } : b);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to decline booking.");
    } finally {
      setRejecting(false);
      setRejectOpen(false);
      setRejectReason("");
    }
  };

  if (loading)
    return (
      <Center>
        <CircularProgress sx={{ color: colors.deepNavy }} />
        <LoadingText>Fetching booking details…</LoadingText>
      </Center>
    );

  if (error || !booking)
    return (
      <Center>
        <EmptyEmoji>{error ? "🚧" : "🔍"}</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          {error ? "Something went wrong" : "Booking not found"}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
          {error
            ? "Couldn't load this booking. Check your connection and try again."
            : "This booking doesn't exist or may have been removed."}
        </Typography>
        <Button variant="contained" onClick={() => router.push("/bookings")}>
          Back to Bookings
        </Button>
      </Center>
    );

  const sc          = statusColors[booking.status] ?? { bg: colors.lightBg, color: colors.mutedText };
  const dirCfg      = DIRECTION_CONFIG[booking.direction] ?? DIRECTION_CONFIG.morning;
  const isRecurring = booking.bookingType === "recurring";
  const stepIndex   = STATUS_STEPS.indexOf(booking.status);

  const isDriver     = userType === "driver";
  const canAcceptReject = isDriver && booking.status === "pending";
  const canCancel       = userType === "parent" && booking.status === "pending";
  // Show trip journey panel for driver on active bookings
  const showDriverJourney = isDriver && ["accepted", "in_progress", "completed"].includes(booking.status);
  // Show parent tracking/rating for parent on active bookings
  const showParentLive = userType === "parent" && ["accepted", "in_progress", "completed"].includes(booking.status);

  return (
    <PageWrapper>
      <BackBtn onClick={() => router.push("/bookings")}>
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Back to Bookings
      </BackBtn>

      {/* ── Driver: pending action banner ── */}
      {canAcceptReject && (
        <ActionBanner>
          <ActionBannerText>
            <ActionBannerTitle>New Booking Request</ActionBannerTitle>
            <ActionBannerSub>
              {booking.parent?.fullName} is requesting a trip for {booking.seatsBooked} child{booking.seatsBooked !== 1 ? "ren" : ""}.
              Review the route details and children below, then respond.
            </ActionBannerSub>
          </ActionBannerText>
          <ActionBannerBtns>
            <RejectBtn onClick={() => setRejectOpen(true)} disabled={accepting}>
              <CancelIcon sx={{ fontSize: 17 }} />
              Decline
            </RejectBtn>
            <AcceptBtn onClick={handleAccept} disabled={accepting}>
              <CheckCircleIcon sx={{ fontSize: 17 }} />
              {accepting ? "Accepting…" : "Accept Trip"}
            </AcceptBtn>
          </ActionBannerBtns>
        </ActionBanner>
      )}

      <Card>
        {/* ── Header ── */}
        <HeaderRow>
          <div>
            <TypeBadge recurring={isRecurring}>
              {isRecurring ? <RepeatIcon sx={{ fontSize: 14 }} /> : <DirectionsCarIcon sx={{ fontSize: 14 }} />}
              {isRecurring ? "Recurring" : "One-time"}
            </TypeBadge>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mt: 0.5 }}>
              Booking Details
            </Typography>
            <Typography variant="body2" sx={{ color: colors.mutedText, mt: 0.25 }}>
              ID: <strong>{booking.bookingId}</strong>
              {booking.createdAt && <> · Booked {formatDate(booking.createdAt)}</>}
            </Typography>
          </div>
          <Chip
            label={STATUS_LABELS[booking.status] ?? booking.status}
            sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: "0.9rem", px: 1 }}
          />
        </HeaderRow>

        {/* ── Status Progress ── */}
        {booking.status !== "canceled" && (
          <StatusTrack>
            {STATUS_STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <StepDot done={i <= stepIndex} active={i === stepIndex}>
                  <StepLabel active={i === stepIndex} done={i <= stepIndex}>
                    {STATUS_LABELS[s]}
                  </StepLabel>
                </StepDot>
                {i < STATUS_STEPS.length - 1 && <StepLine done={i < stepIndex} />}
              </React.Fragment>
            ))}
          </StatusTrack>
        )}

        <Divider sx={{ my: 3, mt: booking.status !== "canceled" ? 5 : 3 }} />

        {/* ── Trip Details ── */}
        <SectionTitle>Trip Details</SectionTitle>

        <DirectionRow>
          {dirCfg.icon}
          <DirectionText>{dirCfg.label}</DirectionText>
        </DirectionRow>

        {isRecurring && booking.recurringMeta ? (
          <RecurringGrid>
            <InfoCard style={{ gridColumn: "1 / -1" }}>
              <InfoLabel>Active Days</InfoLabel>
              <DayChips>
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) =>
                  booking.recurringMeta!.days.includes(d) ? (
                    <DayChip key={d} active>{DAY_SHORT[d]}</DayChip>
                  ) : null
                )}
              </DayChips>
            </InfoCard>

            <InfoCard>
              <InfoLabel>
                <WbSunnyIcon sx={{ fontSize: 13, color: "#F6AD55", mr: 0.5, verticalAlign: "middle" }} />
                Morning Pick-up
              </InfoLabel>
              <InfoValue>{booking.recurringMeta.morningTime}</InfoValue>
            </InfoCard>

            {booking.recurringMeta.eveningTime && (
              <InfoCard>
                <InfoLabel>
                  <NightlightIcon sx={{ fontSize: 13, color: "#9F7AEA", mr: 0.5, verticalAlign: "middle" }} />
                  Evening Drop-off
                </InfoLabel>
                <InfoValue>{booking.recurringMeta.eveningTime}</InfoValue>
              </InfoCard>
            )}

            <InfoCard>
              <InfoLabel>
                <EventIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: "middle" }} />
                Start Date
              </InfoLabel>
              <InfoValue>{formatShortDate(booking.recurringMeta.startDate)}</InfoValue>
            </InfoCard>

            <InfoCard>
              <InfoLabel>
                <EventIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: "middle" }} />
                End Date
              </InfoLabel>
              <InfoValue>
                {booking.recurringMeta.endDate
                  ? formatShortDate(booking.recurringMeta.endDate)
                  : <OngoingText>Ongoing</OngoingText>}
              </InfoValue>
            </InfoCard>
          </RecurringGrid>
        ) : (
          <OneTimeGrid>
            <InfoCard>
              <InfoLabel>
                <EventIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: "middle" }} />
                Pick-up Date
              </InfoLabel>
              <InfoValue>{formatDate(booking.tripDate)}</InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>
                <WbSunnyIcon sx={{ fontSize: 13, color: "#F6AD55", mr: 0.5, verticalAlign: "middle" }} />
                Morning Pick-up Time
              </InfoLabel>
              <InfoValue>{formatTime(booking.tripDate)}</InfoValue>
            </InfoCard>
            {booking.returnTime && (
              <InfoCard>
                <InfoLabel>
                  <NightlightIcon sx={{ fontSize: 13, color: "#9F7AEA", mr: 0.5, verticalAlign: "middle" }} />
                  Evening Return (same day)
                </InfoLabel>
                <InfoValue>{booking.returnTime}</InfoValue>
              </InfoCard>
            )}
          </OneTimeGrid>
        )}

        <Divider sx={{ my: 3 }} />

        {/* ── People ── */}
        <SectionTitle>People</SectionTitle>
        <PeopleGrid>
          <PersonCard>
            <PersonCardHeader>
              <DirectionsCarIcon sx={{ fontSize: 18, color: colors.deepNavy }} />
              <PersonCardTitle>Driver</PersonCardTitle>
            </PersonCardHeader>
            <PersonName>{booking.driver?.fullName ?? "—"}</PersonName>
            {booking.driver?.phoneNumber && (
              <PersonPhone>
                <PhoneIcon sx={{ fontSize: 13 }} />
                {booking.driver.phoneNumber}
              </PersonPhone>
            )}
          </PersonCard>

          <PersonCard>
            <PersonCardHeader>
              <PersonIcon sx={{ fontSize: 18, color: colors.deepNavy }} />
              <PersonCardTitle>Parent / Guardian</PersonCardTitle>
            </PersonCardHeader>
            <PersonName>{booking.parent?.fullName ?? "—"}</PersonName>
            {booking.parent?.phoneNumber && (
              <PersonPhone>
                <PhoneIcon sx={{ fontSize: 13 }} />
                {booking.parent.phoneNumber}
              </PersonPhone>
            )}
          </PersonCard>
        </PeopleGrid>

        <Divider sx={{ my: 3 }} />

        {/* ── Children ── */}
        <SectionHeader>
          <ChildCareIcon sx={{ color: colors.mintCream, mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: colors.deepNavy }}>
            Children ({booking.children.length}) · {booking.seatsBooked} seat{booking.seatsBooked !== 1 ? "s" : ""}
          </Typography>
        </SectionHeader>

        <ChildrenList>
          {booking.children.map((c, i) => (
            <ChildItem key={i}>
              <ChildName>{c.name}</ChildName>
              <ChildMeta>{c.age} yrs · {c.gender} · {c.school}</ChildMeta>
              {(c.pickupLocation || c.dropoffLocation) && (
                <ChildLocMeta>
                  {c.pickupLocation && (
                    <LocItem>
                      <span>🏠</span>
                      <span>Pick-up: {c.pickupLocation.lat.toFixed(5)}, {c.pickupLocation.lng.toFixed(5)}</span>
                    </LocItem>
                  )}
                  {c.dropoffLocation && (
                    <LocItem>
                      <span>🏫</span>
                      <span>Drop-off ({c.school}): {c.dropoffLocation.lat.toFixed(5)}, {c.dropoffLocation.lng.toFixed(5)}</span>
                    </LocItem>
                  )}
                </ChildLocMeta>
              )}
            </ChildItem>
          ))}
        </ChildrenList>

        {/* ── Route map (always shown when coords exist; especially useful for driver before accepting) ── */}
        <BookingRouteMap
          children={booking.children}
          direction={booking.direction}
        />

        {/* ── Driver: trip journey panel ── */}
        {showDriverJourney && (
          <>
            <Divider sx={{ mt: 3 }} />
            <TripJourneyPanel booking={booking as any} onBookingUpdate={handleBookingUpdate} />
          </>
        )}

        {/* ── Parent: live status / tracking / rating ── */}
        {showParentLive && (
          <>
            <Divider sx={{ mt: 3 }} />
            {booking.status === "accepted" && !booking.arrivedAt && (
              <ParentStatusBanner>
                <span>🕐</span>
                <div>
                  <ParentStatusTitle>Waiting for driver</ParentStatusTitle>
                  <ParentStatusSub>You'll be notified when {booking.driver?.fullName ?? "the driver"} is at your pickup point.</ParentStatusSub>
                </div>
              </ParentStatusBanner>
            )}
            {booking.status === "accepted" && booking.arrivedAt && (
              <ParentStatusBanner arrived>
                <span>🎉</span>
                <div>
                  <ParentStatusTitle>Driver has arrived!</ParentStatusTitle>
                  <ParentStatusSub>Please send your child(ren) out to the pickup point now.</ParentStatusSub>
                </div>
              </ParentStatusBanner>
            )}
            {booking.status === "in_progress" && (
              <TripTrackingMap
                bookingId={booking._id}
                initialCoords={booking.tracking?.currentLocation?.coordinates}
              />
            )}
            {booking.status === "completed" && !reviewDone && booking.driver && (
              <RateDriverPanel
                bookingId={booking._id}
                driverId={booking.driver._id}
                driverName={booking.driver.fullName}
                onDone={() => setReviewDone(true)}
              />
            )}
            {booking.status === "completed" && reviewDone && (
              <ParentStatusBanner arrived>
                <span>⭐</span>
                <div>
                  <ParentStatusTitle>Review submitted — thank you!</ParentStatusTitle>
                </div>
              </ParentStatusBanner>
            )}
          </>
        )}

        {/* ── Parent: cancel ── */}
        {canCancel && (
          <>
            <Divider sx={{ mt: 3 }} />
            <CancelRow>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setCancelOpen(true)}
                sx={{ borderRadius: "50px", fontWeight: 700, px: 4 }}
              >
                Cancel Booking
              </Button>
            </CancelRow>
          </>
        )}

        {/* ── Driver: inline accept/reject (also shown at bottom for scroll convenience) ── */}
        {canAcceptReject && (
          <>
            <Divider sx={{ mt: 3 }} />
            <DriverActionsRow>
              <RejectBtn onClick={() => setRejectOpen(true)} disabled={accepting}>
                <CancelIcon sx={{ fontSize: 17 }} />
                Decline Trip
              </RejectBtn>
              <AcceptBtn onClick={handleAccept} disabled={accepting}>
                <CheckCircleIcon sx={{ fontSize: 17 }} />
                {accepting ? "Accepting…" : "Accept Trip"}
              </AcceptBtn>
            </DriverActionsRow>
          </>
        )}
      </Card>

      {/* ── Parent: confirm cancel dialog ── */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Cancel this booking?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will cancel booking <strong>{booking.bookingId}</strong>. The driver will be notified.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelOpen(false)} disabled={canceling}>Keep it</Button>
          <Button
            onClick={handleCancel}
            color="error"
            variant="contained"
            disabled={canceling}
            sx={{ borderRadius: "50px", fontWeight: 700 }}
          >
            {canceling ? "Canceling…" : "Yes, Cancel"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Driver: reject dialog with optional reason ── */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Decline this trip request?</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <DialogContentText sx={{ mb: 2 }}>
            The parent will receive an SMS notification. You can optionally provide a reason.
          </DialogContentText>
          <TextField
            label="Reason (optional)"
            placeholder="e.g. Route not available, fully booked…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)} disabled={rejecting}>Go back</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={rejecting}
            sx={{ borderRadius: "50px", fontWeight: 700 }}
          >
            {rejecting ? "Declining…" : "Yes, Decline"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageWrapper>
  );
}

/* ── Styled components ── */

const PageWrapper = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 24px;
`;

const BackBtn = styled.button`
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid ${colors.border};
  padding: 8px 18px; border-radius: 50px;
  color: ${colors.deepNavy}; font-weight: 600; font-size: 0.875rem;
  cursor: pointer; margin-bottom: 20px; transition: all 0.2s;
  &:hover { background: ${colors.deepNavy}; color: #fff; border-color: ${colors.deepNavy}; }
`;

/* Driver action banner (top of page) */
const ActionBanner = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 16px;
  background: linear-gradient(135deg, ${colors.deepNavy} 0%, #2a4a7f 100%);
  border-radius: 16px; padding: 22px 28px; margin-bottom: 20px;
`;

const ActionBannerText = styled.div`flex: 1;`;

const ActionBannerTitle = styled.p`
  font-size: 1rem; font-weight: 700; color: #fff; margin: 0 0 4px;
`;

const ActionBannerSub = styled.p`
  font-size: 0.85rem; color: rgba(255,255,255,0.75); margin: 0;
`;

const ActionBannerBtns = styled.div`
  display: flex; gap: 10px; align-items: center; flex-shrink: 0;
`;

const RejectBtn = styled.button`
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 50px; font-weight: 700; font-size: 0.875rem;
  cursor: pointer; transition: all 0.18s;
  background: rgba(229,62,62,0.15); color: #FC8181;
  border: 1.5px solid rgba(229,62,62,0.4);
  &:hover:not(:disabled) { background: #E53E3E; color: #fff; border-color: #E53E3E; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const AcceptBtn = styled.button`
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 50px; font-weight: 700; font-size: 0.875rem;
  cursor: pointer; transition: all 0.18s;
  background: ${colors.successGreen}; color: #fff; border: none;
  &:hover:not(:disabled) { background: #276749; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
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
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 16px;
`;

const TypeBadge = styled.span<{ recurring: boolean }>`
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700;
  background: ${({ recurring }) => recurring ? colors.deepNavy + "14" : colors.skyBlue + "14"};
  color: ${({ recurring }) => recurring ? colors.deepNavy : colors.skyBlue};
  border: 1px solid ${({ recurring }) => recurring ? colors.deepNavy + "30" : colors.skyBlue + "30"};
  margin-bottom: 8px;
`;

const StatusTrack = styled.div`
  display: flex; align-items: center; margin-top: 24px;
  overflow-x: auto; padding-bottom: 4px;
`;

const StepDot = styled.div<{ done: boolean; active: boolean }>`
  position: relative;
  width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0;
  background: ${({ done, active }) => active ? colors.deepNavy : done ? colors.skyBlue : colors.border};
  border: 2px solid ${({ done, active }) => active ? colors.deepNavy : done ? colors.skyBlue : colors.border};
`;

const StepLabel = styled.div<{ active: boolean; done: boolean }>`
  position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
  font-size: 0.67rem; font-weight: ${({ active }) => active ? 700 : 500};
  white-space: nowrap;
  color: ${({ active, done }) => active ? colors.deepNavy : done ? colors.skyBlue : colors.mutedText};
`;

const StepLine = styled.div<{ done: boolean }>`
  flex: 1; height: 2px; min-width: 20px;
  background: ${({ done }) => done ? colors.skyBlue : colors.border};
`;

const SectionTitle = styled.h3`
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; color: ${colors.mutedText}; margin: 0 0 14px;
`;

const SectionHeader = styled.div`
  display: flex; align-items: center; margin-bottom: 14px;
`;

const DirectionRow = styled.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
`;

const DirectionText = styled.span`
  font-size: 0.9rem; font-weight: 600; color: ${colors.deepNavy};
`;

const OneTimeGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const RecurringGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px;
`;

const InfoCard = styled.div`
  background: ${colors.lightBg}; border: 1px solid ${colors.border};
  border-radius: 12px; padding: 14px 18px;
`;

const InfoLabel = styled.p`
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: ${colors.mutedText}; margin: 0 0 6px;
`;

const InfoValue = styled.p`
  font-size: 0.975rem; font-weight: 600; color: ${colors.deepNavy}; margin: 0;
`;

const OngoingText = styled.span`
  font-size: 0.875rem; font-style: italic; color: ${colors.mutedText};
`;

const DayChips = styled.div`
  display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;
`;

const DayChip = styled.span<{ active?: boolean }>`
  padding: 3px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700;
  background: ${({ active }) => active ? colors.deepNavy : colors.border};
  color: ${({ active }) => active ? "#fff" : colors.mutedText};
`;

const PeopleGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const PersonCard = styled.div`
  background: ${colors.lightBg}; border: 1px solid ${colors.border};
  border-radius: 14px; padding: 18px;
`;

const PersonCardHeader = styled.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
`;

const PersonCardTitle = styled.span`
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: ${colors.mutedText};
`;

const PersonName = styled.p`
  font-size: 1rem; font-weight: 700; color: ${colors.deepNavy}; margin: 0 0 6px;
`;

const PersonPhone = styled.p`
  display: flex; align-items: center; gap: 5px;
  font-size: 0.85rem; color: ${colors.mutedText}; margin: 0;
`;

const ChildrenList = styled.div`
  display: flex; flex-direction: column; gap: 10px;
`;

const ChildItem = styled.div`
  padding: 14px 18px; background: ${colors.lightBg};
  border-radius: 12px; border: 1px solid ${colors.border};
`;

const ChildName = styled.p`
  font-size: 0.975rem; font-weight: 600; color: ${colors.deepNavy}; margin: 0 0 3px;
`;

const ChildMeta = styled.p`
  font-size: 0.8rem; color: ${colors.mutedText}; margin: 0;
`;

const ChildLocMeta = styled.div`
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const LocItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: ${colors.mutedText};
  font-family: monospace;
`;

const CancelRow = styled.div`
  display: flex; justify-content: flex-end; margin-top: 24px;
`;

const DriverActionsRow = styled.div`
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;
  ${RejectBtn}, ${AcceptBtn} {
    background: none;
    border: 1.5px solid;
  }
  ${RejectBtn} {
    border-color: ${colors.errorRed};
    color: ${colors.errorRed};
    background: transparent;
    &:hover:not(:disabled) { background: ${colors.errorRed}; color: #fff; }
  }
  ${AcceptBtn} {
    border-color: ${colors.successGreen};
    color: ${colors.successGreen};
    background: transparent;
    &:hover:not(:disabled) { background: ${colors.successGreen}; color: #fff; }
  }
`;

const Center = styled.div`
  display: flex; flex-direction: column; justify-content: center;
  align-items: center; min-height: 60vh; text-align: center; gap: 8px;
`;

const LoadingText = styled.p`
  font-size: 0.925rem; color: ${colors.mutedText}; font-style: italic; margin-top: 8px;
`;

const EmptyEmoji = styled.div`
  font-size: 3.5rem; margin-bottom: 8px;
`;

const ParentStatusBanner = styled.div<{ arrived?: boolean }>`
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px 20px; border-radius: 14px;
  background: ${({ arrived }) => arrived ? colors.successGreen + "10" : colors.lightBg};
  border: 1px solid ${({ arrived }) => arrived ? colors.successGreen + "40" : colors.border};
  span { font-size: 1.8rem; flex-shrink: 0; }
`;

const ParentStatusTitle = styled.p`
  font-size: 0.95rem; font-weight: 700; color: ${colors.deepNavy}; margin: 0 0 3px;
`;

const ParentStatusSub = styled.p`
  font-size: 0.82rem; color: ${colors.mutedText}; margin: 0;
`;

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
  Collapse,
  Tooltip,
} from "@mui/material";
import styled, { keyframes } from "styled-components";
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DirectionsIcon from "@mui/icons-material/Directions";
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
  pickedUp?: boolean;
  droppedOff?: boolean;
  driverNote?: string;
  driverRating?: number;
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

/**
 * Opens the best maps app available on the current device.
 * Android: triggers the native intent chooser (geo: URI).
 * iOS: opens Apple Maps (user can switch from there).
 * Desktop: opens Google Maps directions in a new tab.
 */
function openMapsNavigation(lat: number, lng: number, label: string) {
  const ua = navigator.userAgent;
  const q  = encodeURIComponent(label);
  let url: string;
  if (/Android/i.test(ua)) {
    // geo: URI → Android shows app chooser (Google Maps, Waze, HERE, etc.)
    url = `geo:${lat},${lng}?q=${lat},${lng}(${q})`;
  } else if (/iPad|iPhone|iPod/i.test(ua)) {
    // maps: URI → opens Apple Maps; user can choose Google Maps from share sheet
    url = `maps://maps.apple.com/?daddr=${lat},${lng}&q=${q}`;
  } else {
    // Desktop → Google Maps directions in new tab
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  // Use href for app deep links; window.open for web URLs
  if (url.startsWith("http")) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }
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

  // Driver: passenger history notes from previous trips for this parent
  const [passengerNotes, setPassengerNotes] = useState<{
    childName: string; avgRating: number | null; ratingCount: number;
    recentNote: string | null; noteCount: number;
  }[]>([]);

  // Driver: start trip
  const [starting, setStarting] = useState(false);

  // Collapsible detail sections — start open; auto-close for drivers (focus on action panel)
  const [tripDetailsOpen, setTripDetailsOpen] = useState(true);
  const [peopleOpen, setPeopleOpen]           = useState(true);
  const [childrenOpen, setChildrenOpen]       = useState(true);

  const handleStart = async () => {
    setStarting(true);
    try {
      await axios.post(`/api/bookings/${id}/start`, {}, { withCredentials: true });
      toast.success("Trip started! Parent has been notified via SMS.");
      setBooking((b) => b ? { ...b, status: "in_progress" } : b);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not start trip.");
    } finally {
      setStarting(false);
    }
  };

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

  // Collapse detail sections for drivers so the action panel is the first thing they see
  useEffect(() => {
    if (userType === "driver") {
      setTripDetailsOpen(false);
      setPeopleOpen(false);
      setChildrenOpen(false);
    }
  }, [userType]);

  // Drivers: fetch historical passenger notes for this parent (pending/accepted state is most useful)
  useEffect(() => {
    if (userType !== "driver" || !booking?.parent?._id) return;
    axios
      .get(`/api/parents/${booking.parent._id}/passenger-notes`, { withCredentials: true })
      .then((res) => { if (res.data.success) setPassengerNotes(res.data.data); })
      .catch(() => {});
  }, [userType, booking?.parent?._id]);

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

  // Driver action panel counters (updates reactively as TripJourneyPanel patches booking.children)
  const dapTotal      = booking.children.length;
  const dapPickedUp   = booking.children.filter((c) => c.pickedUp).length;
  const dapDroppedOff = booking.children.filter((c) => c.droppedOff).length;
  const dapPct        = dapTotal > 0 ? Math.round((dapDroppedOff / dapTotal) * 100) : 0;
  const dapSchools    = Array.from(new Set(booking.children.map((c) => c.school).filter(Boolean)));

  const isDriver     = userType === "driver";
  const isParent     = userType === "parent";
  const canAcceptReject = isDriver && booking.status === "pending";
  const canCancel       = isParent && booking.status === "pending";
  const canStart        = isDriver && booking.status === "accepted";
  // Show trip journey panel for driver on active bookings
  const showDriverJourney = isDriver && ["accepted", "in_progress", "completed"].includes(booking.status);
  // Show parent tracking/rating for parent on active bookings
  const showParentLive = isParent && ["accepted", "in_progress", "completed"].includes(booking.status);

  // Sticky bar: only for parent pending cancel (driver actions live in the top action panel)
  const hasStickyBar = canCancel;

  return (
    <PageWrapper hasStickyBar={hasStickyBar}>
      <BackBtn onClick={() => router.push("/bookings")}>
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Back to Bookings
      </BackBtn>

      {/* ── Driver Action Panel — primary CTA at the top ── */}
      {isDriver && (
        <DriverActionPanel status={booking.status}>
          {/* PENDING → review and respond */}
          {canAcceptReject && (
            <>
              <DAPTagRow><DAPTag variant="pending">🔔 New Request</DAPTag></DAPTagRow>
              <DAPTitle>{booking.parent?.fullName ?? "Parent"} wants to book {booking.seatsBooked} seat{booking.seatsBooked !== 1 ? "s" : ""}</DAPTitle>
              <DAPSub>{formatDate(booking.tripDate)}{dapSchools.length > 0 && <> · {dapSchools.join(", ")}</>}</DAPSub>
              <DAPActions>
                <DAPDeclineBtn onClick={() => setRejectOpen(true)} disabled={accepting}>
                  <CancelIcon sx={{ fontSize: 16 }} /> Decline
                </DAPDeclineBtn>
                <DAPAcceptBtn onClick={handleAccept} disabled={accepting}>
                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                  {accepting ? "Accepting…" : "Accept Trip"}
                </DAPAcceptBtn>
              </DAPActions>
            </>
          )}

          {/* ACCEPTED → start the trip */}
          {canStart && (
            <>
              <DAPTagRow><DAPTag variant="ready">🚦 Ready to Depart</DAPTag></DAPTagRow>
              <DAPTitle>Trip for {booking.parent?.fullName ?? "Parent"}</DAPTitle>
              <DAPSub>{formatDate(booking.tripDate)} · {booking.seatsBooked} seat{booking.seatsBooked !== 1 ? "s" : ""}</DAPSub>
              <DAPStartBtn onClick={handleStart} disabled={starting}>
                {starting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : <span>🚌</span>}
                {starting ? "Starting…" : "Start Trip — Notify Parent"}
              </DAPStartBtn>
            </>
          )}

          {/* IN PROGRESS → live child counter + progress bar */}
          {booking.status === "in_progress" && (
            <>
              <DAPTagRow><DAPTag variant="active">🏃 Trip Live</DAPTag></DAPTagRow>
              <DAPCounterRow>
                <DAPCounter>
                  <DAPCounterNum>{dapPickedUp}<DAPCounterTotal>/{dapTotal}</DAPCounterTotal></DAPCounterNum>
                  <DAPCounterLabel>Picked Up</DAPCounterLabel>
                </DAPCounter>
                <DAPCounterDivider />
                <DAPCounter>
                  <DAPCounterNum>{dapDroppedOff}<DAPCounterTotal>/{dapTotal}</DAPCounterTotal></DAPCounterNum>
                  <DAPCounterLabel>Dropped Off</DAPCounterLabel>
                </DAPCounter>
              </DAPCounterRow>
              <DAPProgressTrack>
                <DAPProgressFill pct={dapPct} />
              </DAPProgressTrack>
              <DAPSub>{dapPct}% complete · Use the Journey panel below to mark individual children</DAPSub>
            </>
          )}

          {/* COMPLETED → summary */}
          {booking.status === "completed" && (
            <>
              <DAPTagRow><DAPTag variant="done">✅ Trip Complete</DAPTag></DAPTagRow>
              <DAPTitle>All {dapTotal} child{dapTotal !== 1 ? "ren" : ""} delivered safely</DAPTitle>
              <DAPSub>Great work! This trip has been recorded as completed.</DAPSub>
            </>
          )}

          {/* CANCELED / REJECTED */}
          {["canceled", "rejected"].includes(booking.status) && (
            <>
              <DAPTagRow><DAPTag variant="canceled">❌ {booking.status === "rejected" ? "Rejected" : "Cancelled"}</DAPTag></DAPTagRow>
              <DAPSub>This booking was not completed.</DAPSub>
            </>
          )}
        </DriverActionPanel>
      )}

      {/* ── Stage banners for parent only ── */}
      {isParent && booking.status === "completed" && (
        <StageBanner variant="done">
          <StageBannerIcon>✅</StageBannerIcon>
          <StageBannerBody>
            <StageBannerTitle>Trip completed</StageBannerTitle>
            <StageBannerSub>All children were delivered safely.</StageBannerSub>
          </StageBannerBody>
        </StageBanner>
      )}
      {isParent && ["canceled", "rejected"].includes(booking.status) && (
        <StageBanner variant="canceled">
          <StageBannerIcon>❌</StageBannerIcon>
          <StageBannerBody>
            <StageBannerTitle>Booking {booking.status}</StageBannerTitle>
            <StageBannerSub>Browse drivers to make a new booking.</StageBannerSub>
          </StageBannerBody>
          <Button size="small" variant="outlined" onClick={() => router.push("/drivers")} sx={{ borderRadius: "50px", flexShrink: 0, alignSelf: "center" }}>Browse Drivers</Button>
        </StageBanner>
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
        <CollapsibleHeader onClick={() => setTripDetailsOpen((v) => !v)}>
          <SectionTitle style={{ margin: 0 }}>Trip Details</SectionTitle>
          <ExpandMoreIcon sx={{ fontSize: 19, color: colors.mutedText, transform: tripDetailsOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </CollapsibleHeader>
        <Collapse in={tripDetailsOpen}>
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
        </Collapse>

        <Divider sx={{ my: 3 }} />

        {/* ── People ── */}
        <CollapsibleHeader onClick={() => setPeopleOpen((v) => !v)}>
          <SectionTitle style={{ margin: 0 }}>People</SectionTitle>
          <ExpandMoreIcon sx={{ fontSize: 19, color: colors.mutedText, transform: peopleOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </CollapsibleHeader>
        <Collapse in={peopleOpen}>
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
        </Collapse>

        <Divider sx={{ my: 3 }} />

        {/* ── Children ── */}
        <CollapsibleHeader onClick={() => setChildrenOpen((v) => !v)}>
          <SectionHeader style={{ margin: 0 }}>
            <ChildCareIcon sx={{ color: colors.mintCream, mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.deepNavy }}>
              Children ({booking.children.length}) · {booking.seatsBooked} seat{booking.seatsBooked !== 1 ? "s" : ""}
            </Typography>
          </SectionHeader>
          <ExpandMoreIcon sx={{ fontSize: 19, color: colors.mutedText, transform: childrenOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
        </CollapsibleHeader>
        <Collapse in={childrenOpen}>
        <ChildrenList>
          {booking.children.map((c, i) => (
            <ChildItem key={i}>
              <ChildName>{c.name}</ChildName>
              <ChildMeta>{c.age} yrs · {c.gender} · {c.school}</ChildMeta>

              {/* Parent view of completed trip: show what the driver noted */}
              {isParent && booking.status === "completed" && (c.driverRating || c.driverNote) && (
                <ChildDriverNote>
                  {c.driverRating && (
                    <InlineStars>
                      {[1,2,3,4,5].map((n) => (
                        <span key={n} style={{ color: n <= c.driverRating! ? "#F6AD55" : "#CBD5E0", fontSize: "13px" }}>★</span>
                      ))}
                    </InlineStars>
                  )}
                  {c.driverNote && <ChildNoteText>&ldquo;{c.driverNote}&rdquo;</ChildNoteText>}
                </ChildDriverNote>
              )}
              {(c.pickupLocation || c.dropoffLocation) && (
                <ChildLocMeta>
                  {c.pickupLocation && (
                    <Tooltip title="Tap to navigate with your maps app" placement="top">
                      <LocLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openMapsNavigation(
                            c.pickupLocation!.lat,
                            c.pickupLocation!.lng,
                            `${c.name} pickup`
                          );
                        }}
                      >
                        <span>🏠</span>
                        <LocRouteLabel>Pick-up</LocRouteLabel>
                        <LocCoords>{c.pickupLocation.lat.toFixed(5)}, {c.pickupLocation.lng.toFixed(5)}</LocCoords>
                        <DirectionsIcon sx={{ fontSize: 13, flexShrink: 0 }} />
                      </LocLink>
                    </Tooltip>
                  )}
                  {c.dropoffLocation && (
                    <Tooltip title="Tap to navigate with your maps app" placement="top">
                      <LocLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openMapsNavigation(
                            c.dropoffLocation!.lat,
                            c.dropoffLocation!.lng,
                            `${c.name} drop-off at ${c.school}`
                          );
                        }}
                      >
                        <span>🏫</span>
                        <LocRouteLabel>Drop-off</LocRouteLabel>
                        <LocCoords>{c.dropoffLocation.lat.toFixed(5)}, {c.dropoffLocation.lng.toFixed(5)}</LocCoords>
                        <DirectionsIcon sx={{ fontSize: 13, flexShrink: 0 }} />
                      </LocLink>
                    </Tooltip>
                  )}
                </ChildLocMeta>
              )}
            </ChildItem>
          ))}
        </ChildrenList>

        {/* ── Route map (shown inside the children section) ── */}
        <BookingRouteMap
          children={booking.children}
          direction={booking.direction}
        />

        {/* ── Driver: subtle passenger notes from previous trips ── */}
        {isDriver && passengerNotes.length > 0 && (
          <PassengerNotesSection>
            <PassengerNotesLabel>Notes from previous trips</PassengerNotesLabel>
            {passengerNotes.map((p) => (
              <PassengerNoteRow key={p.childName}>
                <PassengerNoteName>{p.childName}</PassengerNoteName>
                {p.avgRating && (
                  <PassengerNoteRating>
                    {[1,2,3,4,5].map((n) => (
                      <span key={n} style={{ color: n <= Math.round(p.avgRating!) ? "#F6AD55" : "#CBD5E0", fontSize: "12px" }}>★</span>
                    ))}
                    <span>{p.avgRating} · {p.ratingCount} trip{p.ratingCount !== 1 ? "s" : ""}</span>
                  </PassengerNoteRating>
                )}
                {p.recentNote && (
                  <PassengerNoteText>&ldquo;{p.recentNote}&rdquo;</PassengerNoteText>
                )}
              </PassengerNoteRow>
            ))}
          </PassengerNotesSection>
        )}
        </Collapse>

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
              <Typography variant="caption" sx={{ color: colors.mutedText }}>Changed your mind? Use the button below.</Typography>
            </CancelRow>
          </>
        )}

      </Card>

      {/* ── Dialogs ── */}

      {/* ── Sticky bottom action bar (parent cancel only) ── */}
      {hasStickyBar && (
        <StickyBar>
          <StickyBarInner>
            <StickyHint>Only pending bookings can be cancelled</StickyHint>
            <StickyCancelBtn onClick={() => setCancelOpen(true)}>
              Cancel Booking
            </StickyCancelBtn>
          </StickyBarInner>
        </StickyBar>
      )}

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

/* ── Animations ── */
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Driver Action Panel ── */
const DAP_BG: Record<string, string> = {
  pending:     "#FFFBEB",
  accepted:    "#ECFDF5",
  in_progress: "#EBF8FF",
  completed:   "#F0FDF4",
  canceled:    "#FFF5F5",
  rejected:    "#FFF5F5",
};
const DAP_BORDER: Record<string, string> = {
  pending:     "#FCD34D",
  accepted:    "#6EE7B7",
  in_progress: "#93C5FD",
  completed:   "#9AE6B4",
  canceled:    "#FEB2B2",
  rejected:    "#FEB2B2",
};
const DAP_TAG_STYLE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FEF3C7", color: "#92400E" },
  ready:    { bg: "#D1FAE5", color: "#065F46" },
  active:   { bg: "#DBEAFE", color: "#1E40AF" },
  done:     { bg: "#D1FAE5", color: "#065F46" },
  canceled: { bg: "#FEE2E2", color: "#991B1B" },
};
const DriverActionPanel = styled.div<{ status: string }>`
  border-radius: 20px; padding: 22px 24px; margin-bottom: 20px;
  border: 1.5px solid ${(p) => DAP_BORDER[p.status] ?? colors.border};
  background: ${(p) => DAP_BG[p.status] ?? colors.lightBg};
  animation: ${slideUp} 0.35s ease both;
`;
const DAPTagRow = styled.div`margin-bottom: 8px;`;
const DAPTag = styled.span<{ variant: string }>`
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 12px; border-radius: 50px;
  font-size: 0.73rem; font-weight: 700; letter-spacing: 0.4px;
  background: ${(p) => DAP_TAG_STYLE[p.variant]?.bg ?? colors.lightBg};
  color: ${(p) => DAP_TAG_STYLE[p.variant]?.color ?? colors.mutedText};
`;
const DAPTitle = styled.p`
  font-size: 1.05rem; font-weight: 700; color: ${colors.deepNavy};
  margin: 0 0 4px; line-height: 1.3;
`;
const DAPSub = styled.p`
  font-size: 0.82rem; color: ${colors.mutedText};
  margin: 0 0 4px; line-height: 1.45;
`;
const DAPActions = styled.div`display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 14px;`;
const DAPDeclineBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  border-radius: 50px; font-size: 0.88rem; font-weight: 700; cursor: pointer;
  background: transparent; border: 1.5px solid ${colors.errorRed}44; color: ${colors.errorRed};
  transition: all 0.18s;
  &:hover:not(:disabled) { background: ${colors.errorRed}; color: #fff; border-color: ${colors.errorRed}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const DAPAcceptBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 10px 22px;
  border-radius: 50px; font-size: 0.88rem; font-weight: 800; cursor: pointer; border: none;
  background: ${colors.successGreen}; color: #fff;
  box-shadow: 0 3px 10px ${colors.successGreen}44;
  transition: all 0.18s;
  &:hover:not(:disabled) { background: #276749; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
`;
const DAPStartBtn = styled.button`
  display: flex; align-items: center; gap: 8px; padding: 13px 28px;
  border-radius: 50px; font-size: 0.95rem; font-weight: 800; cursor: pointer; border: none;
  background: linear-gradient(135deg, ${colors.deepNavy}, #2c508a); color: #fff;
  width: 100%; justify-content: center; margin-top: 12px;
  box-shadow: 0 4px 16px rgba(26,54,93,0.22);
  transition: all 0.18s;
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,54,93,0.32); }
  &:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
`;
const DAPCounterRow = styled.div`
  display: flex; align-items: stretch; gap: 0; margin: 12px 0 0;
`;
const DAPCounter = styled.div`
  flex: 1; text-align: center; padding: 14px 10px;
  background: ${colors.pureWhite}; border: 1px solid ${colors.border}; border-radius: 12px;
`;
const DAPCounterNum = styled.div`
  font-size: 2.1rem; font-weight: 800; color: ${colors.deepNavy}; line-height: 1;
`;
const DAPCounterTotal = styled.span`
  font-size: 1.15rem; font-weight: 400; color: ${colors.mutedText};
`;
const DAPCounterLabel = styled.div`
  font-size: 0.67rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: ${colors.mutedText}; margin-top: 5px;
`;
const DAPCounterDivider = styled.div`width: 12px; flex-shrink: 0;`;
const DAPProgressTrack = styled.div`
  height: 7px; border-radius: 50px; background: ${colors.border};
  overflow: hidden; margin: 14px 0 8px;
`;
const DAPProgressFill = styled.div<{ pct: number }>`
  height: 100%; border-radius: 50px; width: ${(p) => p.pct}%;
  background: ${colors.successGreen}; transition: width 0.6s ease;
`;

/* Collapsible section header */
const CollapsibleHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; user-select: none; padding: 4px 0; margin-bottom: 14px;
  &:hover > svg { color: ${colors.deepNavy} !important; }
`;

/* ── Page wrapper + stage banners ── */

const PageWrapper = styled.div<{ hasStickyBar?: boolean }>`
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 24px ${(p) => p.hasStickyBar ? "120px" : "40px"};
`;

/* Stage banners */
const BANNER_COLORS: Record<string, { bg: string; border: string }> = {
  request:  { bg: "#EFF6FF", border: "#BFD7FF" },
  ready:    { bg: "#F0FDF4", border: "#9AE6B4" },
  active:   { bg: "#EBF8FF", border: "#90CDF4" },
  done:     { bg: "#F0FFF4", border: "#9AE6B4" },
  canceled: { bg: "#FFF5F5", border: "#FEB2B2" },
};

const StageBanner = styled.div<{ variant: string }>`
  display: flex; align-items: flex-start; gap: 14px; flex-wrap: wrap;
  padding: 16px 20px; border-radius: 14px; margin-bottom: 20px;
  background: ${(p) => BANNER_COLORS[p.variant]?.bg ?? "#F7FAFC"};
  border: 1px solid ${(p) => BANNER_COLORS[p.variant]?.border ?? "#E2E8F0"};
  animation: ${slideUp} 0.3s ease both;
`;
const StageBannerIcon = styled.span`font-size: 1.5rem; flex-shrink: 0; margin-top: 2px;`;
const StageBannerBody = styled.div`flex: 1;`;
const StageBannerTitle = styled.p`font-size: 0.95rem; font-weight: 700; color: ${colors.deepNavy}; margin: 0 0 3px;`;
const StageBannerSub   = styled.p`font-size: 0.82rem; color: ${colors.mutedText}; margin: 0; line-height: 1.45;`;

/* Sticky action bar */
const StickyBar = styled.div`
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid ${colors.border};
  padding: 12px 20px 20px;
  box-shadow: 0 -4px 24px rgba(26,54,93,0.1);
`;
const StickyBarInner = styled.div`
  max-width: 860px; margin: 0 auto;
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
`;
const StickyHint = styled.span`
  font-size: 0.74rem; color: ${colors.mutedText}; flex: 1; min-width: 160px;
`;
const StickyBtnRow = styled.div`display: flex; gap: 10px; flex-shrink: 0;`;
const StickyAcceptBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 12px 28px;
  border-radius: 50px; font-size: 0.9rem; font-weight: 800; cursor: pointer; border: none;
  background: ${colors.successGreen}; color: #fff;
  box-shadow: 0 4px 14px ${colors.successGreen}55;
  transition: all 0.18s;
  &:hover:not(:disabled) { background: #276749; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
`;
const StickyDeclineBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 12px 22px;
  border-radius: 50px; font-size: 0.9rem; font-weight: 700; cursor: pointer;
  background: transparent; border: 1.5px solid ${colors.errorRed}; color: ${colors.errorRed};
  transition: all 0.18s;
  &:hover:not(:disabled) { background: ${colors.errorRed}; color: #fff; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const StickyStartBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 14px 32px;
  border-radius: 50px; font-size: 0.95rem; font-weight: 800; cursor: pointer; border: none;
  background: linear-gradient(135deg, ${colors.deepNavy}, #2c508a);
  color: #fff; flex: 1; justify-content: center;
  box-shadow: 0 4px 16px rgba(26,54,93,0.3);
  transition: all 0.18s;
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,54,93,0.4); }
  &:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
`;
const StickyCancelBtn = styled.button`
  padding: 11px 24px; border-radius: 50px; font-size: 0.88rem; font-weight: 700; cursor: pointer;
  background: transparent; border: 1.5px solid ${colors.errorRed}; color: ${colors.errorRed};
  transition: all 0.18s;
  &:hover { background: ${colors.errorRed}; color: #fff; }
`;

const BackBtn = styled.button`
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid ${colors.border};
  padding: 8px 18px; border-radius: 50px;
  color: ${colors.deepNavy}; font-weight: 600; font-size: 0.875rem;
  cursor: pointer; margin-bottom: 20px; transition: all 0.2s;
  &:hover { background: ${colors.deepNavy}; color: #fff; border-color: ${colors.deepNavy}; }
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
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/* Driver note shown to parent on completed trip */
const ChildDriverNote = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  margin-top: 6px; padding: 6px 10px; border-radius: 8px;
  background: ${colors.lightBg}; border: 1px solid ${colors.border};
`;
const InlineStars = styled.span`display: flex; gap: 1px; flex-shrink: 0;`;
const ChildNoteText = styled.span`
  font-size: 0.76rem; color: ${colors.mutedText}; font-style: italic; line-height: 1.4;
`;

/* Driver view: historical passenger notes (subtle) */
const PassengerNotesSection = styled.div`
  margin-top: 16px; padding: 12px 14px; border-radius: 12px;
  background: ${colors.lightBg}; border: 1px solid ${colors.border};
  display: flex; flex-direction: column; gap: 10px;
`;
const PassengerNotesLabel = styled.p`
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: ${colors.mutedText}; margin: 0;
`;
const PassengerNoteRow = styled.div`
  display: flex; flex-direction: column; gap: 3px;
  padding-bottom: 10px; border-bottom: 1px solid ${colors.border};
  &:last-child { padding-bottom: 0; border-bottom: none; }
`;
const PassengerNoteName = styled.span`
  font-size: 0.82rem; font-weight: 700; color: ${colors.deepNavy};
`;
const PassengerNoteRating = styled.div`
  display: flex; align-items: center; gap: 4px;
  font-size: 0.72rem; color: ${colors.mutedText}; font-weight: 500;
`;
const PassengerNoteText = styled.p`
  font-size: 0.76rem; color: ${colors.mutedText}; font-style: italic;
  margin: 0; line-height: 1.45;
`;

/* Clickable map navigation link */
const LocLink = styled.a`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px 5px 8px; border-radius: 8px;
  border: 1px solid ${colors.skyBlue}33;
  background: ${colors.skyBlue}08;
  color: ${colors.skyBlue}; text-decoration: none;
  cursor: pointer; transition: all 0.15s;
  max-width: 100%; overflow: hidden;
  &:hover, &:focus {
    background: ${colors.skyBlue}18;
    border-color: ${colors.skyBlue}66;
    text-decoration: none;
    outline: none;
  }
  &:active { transform: scale(0.97); }
`;
const LocRouteLabel = styled.span`
  font-size: 0.73rem; font-weight: 700; white-space: nowrap; flex-shrink: 0;
`;
const LocCoords = styled.span`
  font-family: monospace; font-size: 0.71rem; opacity: 0.8;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
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
